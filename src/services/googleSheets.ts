import { Order, Product } from '../types';

const SPREADSHEET_TITLE = 'Avenue Café - Live Orders & Cloud Database';

export interface SpreadsheetInfo {
  id: string;
  url: string;
  name: string;
  createdNew: boolean;
}

/**
 * Searches user's Google Drive for an existing Avenue Café spreadsheet,
 * or creates a beautifully formatted new one.
 */
export async function getOrCreateCafeSpreadsheet(accessToken: string): Promise<SpreadsheetInfo> {
  // 1. Search Google Drive for existing file
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(
    SPREADSHEET_TITLE
  )}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,webViewLink)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const existing = searchData.files[0];
      return {
        id: existing.id,
        url: existing.webViewLink || `https://docs.google.com/spreadsheets/d/${existing.id}/edit`,
        name: existing.name,
        createdNew: false
      };
    }
  }

  // 2. Create new spreadsheet with Sheets API
  const createSpreadsheetBody = {
    properties: {
      title: SPREADSHEET_TITLE
    },
    sheets: [
      {
        properties: {
          title: 'Live Orders',
          gridProperties: {
            frozenRowCount: 1
          }
        }
      },
      {
        properties: {
          title: 'Menu Catalog',
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }
    ]
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createSpreadsheetBody)
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${errText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const webViewLink =
    createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 3. Setup Header Columns for Orders and Menu
  const orderHeaders = [
    'Order #',
    'Date & Time',
    'Customer Name',
    'Phone',
    'Type',
    'Delivery Address',
    'Payment Method',
    'E-Wallet / Reference #',
    'Subtotal (PHP)',
    'VAT 8% (PHP)',
    'Delivery Fee (PHP)',
    'Total Amount (PHP)',
    'Order Status',
    'Items Ordered',
    'Customer Notes'
  ];

  const menuHeaders = [
    'Product ID',
    'Item Name',
    'Category',
    'Price (PHP)',
    'Status',
    'Prep Time (mins)',
    'Popular',
    'Description'
  ];

  // Set headers using batchUpdate
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'Live Orders'!A1:O1",
            values: [orderHeaders]
          },
          {
            range: "'Menu Catalog'!A1:H1",
            values: [menuHeaders]
          }
        ]
      })
    }
  );

  return {
    id: spreadsheetId,
    url: webViewLink,
    name: SPREADSHEET_TITLE,
    createdNew: true
  };
}

/**
 * Appends a new customer order row to the 'Live Orders' sheet in Google Sheets.
 */
export async function logOrderToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  order: Order
): Promise<boolean> {
  const itemsText = order.items
    .map((item) => `${item.quantity}x ${item.productName}${item.notes ? ` [${item.notes}]` : ''}`)
    .join('; ');

  const rowData = [
    order.orderNumber,
    new Date(order.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
    order.customer.name,
    order.customer.phone,
    order.deliveryType === 'delivery' ? 'Door Delivery' : 'Store Pickup',
    order.customer.address || (order.deliveryType === 'delivery' ? 'N/A' : 'Store Pickup'),
    order.paymentMethod.toUpperCase(),
    order.customer.referenceNumber || order.customer.ewalletNumber || 'N/A',
    order.subtotal,
    order.tax,
    order.deliveryFee,
    order.total,
    order.status.toUpperCase(),
    itemsText,
    order.customer.notes || ''
  ];

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Live Orders'!A:O:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [rowData]
    })
  });

  return res.ok;
}

/**
 * Syncs multiple orders (e.g. batch sync from local database to Google Sheets).
 */
export async function syncAllOrdersToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  orders: Order[]
): Promise<number> {
  if (orders.length === 0) return 0;

  // Clear existing orders rows (preserve header A1:O1)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Live Orders'!A2:O:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const rows = orders.map((order) => {
    const itemsText = order.items
      .map((item) => `${item.quantity}x ${item.productName}${item.notes ? ` [${item.notes}]` : ''}`)
      .join('; ');

    return [
      order.orderNumber,
      new Date(order.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
      order.customer.name,
      order.customer.phone,
      order.deliveryType === 'delivery' ? 'Door Delivery' : 'Store Pickup',
      order.customer.address || (order.deliveryType === 'delivery' ? 'N/A' : 'Store Pickup'),
      order.paymentMethod.toUpperCase(),
      order.customer.referenceNumber || order.customer.ewalletNumber || 'N/A',
      order.subtotal,
      order.tax,
      order.deliveryFee,
      order.total,
      order.status.toUpperCase(),
      itemsText,
      order.customer.notes || ''
    ];
  });

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Live Orders'!A2:O:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: rows
    })
  });

  if (!res.ok) {
    throw new Error('Failed to sync orders to Google Sheet');
  }

  return orders.length;
}

/**
 * Updates the Order Status in the Google Sheet for a given order number.
 */
export async function updateOrderStatusInGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  orderNumber: string,
  newStatus: string
): Promise<boolean> {
  try {
    // Read column A to find matching row
    const getRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Live Orders'!A:A`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!getRes.ok) return false;
    const data = await getRes.json();
    const rows: string[][] = data.values || [];

    const rowIndex = rows.findIndex(
      (row) => row[0] && row[0].toString().trim().toUpperCase() === orderNumber.trim().toUpperCase()
    );

    if (rowIndex === -1) return false; // not found

    // Column M is Order Status (13th column, 1-indexed is M, row is rowIndex + 1)
    const targetCell = `'Live Orders'!M${rowIndex + 1}`;
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        targetCell
      )}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [[newStatus.toUpperCase()]]
        })
      }
    );

    return updateRes.ok;
  } catch (err) {
    console.warn('Error updating status in sheet:', err);
    return false;
  }
}

/**
 * Exports/syncs current product menu catalog into 'Menu Catalog' sheet.
 */
export async function syncMenuCatalogToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  products: Product[]
): Promise<number> {
  // Clear existing menu rows (preserve header A1:H1)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Menu Catalog'!A2:H:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const rows = products.map((product) => [
    product.id,
    product.name,
    product.category,
    product.price,
    product.available ? 'In Stock' : 'Sold Out',
    product.preparationTimeMinutes || 5,
    product.isPopular ? 'Yes' : 'No',
    product.description
  ]);

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Menu Catalog'!A2:H:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: rows
    })
  });

  if (!res.ok) {
    throw new Error('Failed to sync menu to Google Sheet');
  }

  return products.length;
}
