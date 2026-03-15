export interface QueryExample {
  query: string;
  label: string;
  desc: string;
}

export const QUERY_EXAMPLES: QueryExample[] = [
  {
    query: "$.store.name",
    label: "Store name",
    desc: "Simple key access — returns a single value",
  },
  {
    query: "$.store.rating",
    label: "Rating value",
    desc: "Access a numeric field at any depth",
  },
  {
    query: "$.store.orders[*].status",
    label: "All order statuses",
    desc: "[*] wildcard maps over every array item",
  },
  {
    query: "$.store.orders[*].user.email",
    label: "All customer emails",
    desc: "Dot-chain into nested objects after wildcard",
  },
  {
    query: "$.store.orders[0].items",
    label: "First order's items",
    desc: "[0] picks a specific index from an array",
  },
  {
    query: "$.store.orders[1].total",
    label: "Second order total",
    desc: "Combine index access with a field name",
  },
  {
    query: '$.store.orders[?(@.status == "delivered")]',
    label: "Delivered orders",
    desc: "[?(...)] filter expression on array items",
  },
  {
    query: "$.store.orders[?(@.total > 50000)]",
    label: "Orders over ₹50k",
    desc: "Numeric comparison inside a filter",
  },
  {
    query: '$.store.orders[?(@.user.tier == "premium")]',
    label: "Premium customers",
    desc: "Filter on a nested object field",
  },
  {
    query: "$..name",
    label: "All 'name' fields",
    desc: ".. recursive descent — finds key anywhere in tree",
  },
  {
    query: "$.store.orders[*].items[*].price",
    label: "All item prices",
    desc: "Double wildcard drills through two arrays",
  },
  {
    query: '$.store.orders[?(@.status != "failed")].orderId',
    label: "Non-failed order IDs",
    desc: "!= operator to exclude a value",
  },
];

export const MOCK_JSON_SNIPPET = `{
  "store": {
    "name": "TechMart",
    "location": "Bangalore",
    "rating": 4.8,
    "active": true,
    "orders": [
      {
        "orderId": "ORD1001",
        "status": "delivered",
        "total": 87500,
        "user": { "name": "Rohan", "email": "rohan@example.com", "tier": "premium" },
        "items": [
          { "name": "MacBook Pro", "price": 75000, "qty": 1 },
          { "name": "USB-C Hub",   "price": 12500, "qty": 1 }
        ]
      },
      {
        "orderId": "ORD1002",
        "status": "failed",
        "total": 63000,
        "user": { "name": "Ankit", "email": "ankit@example.com", "tier": "standard" },
        "items": [
          { "name": "Sony WH-1000XM5", "price": 28000, "qty": 1 },
          { "name": "iPad Air",        "price": 35000, "qty": 1 }
        ]
      },
      {
        "orderId": "ORD1003",
        "status": "pending",
        "total": 15999,
        "user": { "name": "Priya", "email": "priya@example.com", "tier": "premium" },
        "items": [
          { "name": "Mechanical Keyboard", "price": 15999, "qty": 1 }
        ]
      }
    ]
  }
}`;
