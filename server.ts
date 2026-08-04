import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  const SUPABASE_URL = "https://jjselsikkgcixhhjxyfr.supabase.co";
  const SUPABASE_KEY = "sb_publishable_pyjSxC9S9jjRqoF9wf0FLw_9_QUJK8y";

  const supabaseHeaders = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };

  // 1. GET /api/products
  app.get("/api/products", async (req, res) => {
    try {
      // Try Products table first
      const url1 = `${SUPABASE_URL}/rest/v1/Products?select=*&order=id.asc`;
      const response1 = await fetch(url1, { headers: supabaseHeaders });
      
      if (response1.status === 200) {
        const data = await response1.json();
        if (Array.isArray(data) && data.length > 0) {
          return res.json({ data });
        }
      }
      
      // Fallback to products table
      const url2 = `${SUPABASE_URL}/rest/v1/products?select=*&order=id.asc`;
      const response2 = await fetch(url2, { headers: supabaseHeaders });
      const data2 = await response2.json();
      return res.json({ data: data2 });
    } catch (err: any) {
      console.error("API Error in GET /api/products:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // 2. POST /api/products/seed
  app.post("/api/products/seed", async (req, res) => {
    try {
      // Check if Products has items
      let hasProducts = false;
      try {
        const urlCheck = `${SUPABASE_URL}/rest/v1/Products?select=id&limit=1`;
        const resCheck = await fetch(urlCheck, { headers: supabaseHeaders });
        if (resCheck.status === 200) {
          const d = await resCheck.json();
          if (d && d.length > 0) hasProducts = true;
        }
      } catch (e) {}

      if (!hasProducts) {
        try {
          const urlCheck2 = `${SUPABASE_URL}/rest/v1/products?select=id&limit=1`;
          const resCheck2 = await fetch(urlCheck2, { headers: supabaseHeaders });
          if (resCheck2.status === 200) {
            const d = await resCheck2.json();
            if (d && d.length > 0) hasProducts = true;
          }
        } catch (e) {}
      }

      if (hasProducts) {
        return res.json({ success: true, message: "Products already seeded" });
      }

      const productsToSeed = [
        {
          brand: 'Rolex',
          Name: 'Submariner Date',
          price: 14100,
          image_url: 'https://res.cloudinary.com/vpliervv/image/upload/watch1.jpg',
          description: 'The iconic divers watch waterproof to 300 metres.',
          badge: 'Bestseller',
          stock: 10
        },
        {
          brand: 'Audemars Piguet',
          Name: 'Code 11.59 Black',
          price: 32500,
          image_url: 'https://res.cloudinary.com/vpliervv/image/upload/watch2.jpg',
          description: 'Rose gold case black lacquered dial.',
          badge: 'Limited',
          stock: 5
        },
        {
          brand: 'Omega',
          Name: 'Speedmaster Moonwatch',
          price: 7450,
          image_url: 'https://res.cloudinary.com/vpliervv/image/upload/watch3.jpg',
          description: 'First watch worn on the moon.',
          badge: 'Iconic',
          stock: 8
        },
        {
          brand: 'Altair',
          Name: 'Automatic Green Dial',
          price: 3200,
          image_url: 'https://res.cloudinary.com/vpliervv/image/upload/watch4.jpg',
          description: 'Modern elegance Swiss automatic movement.',
          badge: 'New',
          stock: 15
        },
        {
          brand: 'A. Lange & Sohne',
          Name: '1815 Chronograph',
          price: 48000,
          image_url: 'https://res.cloudinary.com/vpliervv/image/upload/watch5.jpg',
          description: 'German precision handcrafted movement.',
          badge: 'Exclusive',
          stock: 3
        }
      ];

      // Try Products first
      const urlSeed1 = `${SUPABASE_URL}/rest/v1/Products`;
      const responseSeed1 = await fetch(urlSeed1, {
        method: "POST",
        headers: { ...supabaseHeaders, "Prefer": "return=representation" },
        body: JSON.stringify(productsToSeed)
      });

      if (responseSeed1.status === 201) {
        return res.json({ success: true, message: "Seeded Products table" });
      }

      // Try fallback to products
      const urlSeed2 = `${SUPABASE_URL}/rest/v1/products`;
      const responseSeed2 = await fetch(urlSeed2, {
        method: "POST",
        headers: { ...supabaseHeaders, "Prefer": "return=representation" },
        body: JSON.stringify(productsToSeed)
      });

      return res.json({ success: true, message: "Seeded products table" });
    } catch (err: any) {
      console.error("API Error in POST /api/products/seed:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // 3. POST /api/orders
  app.post("/api/orders", async (req, res) => {
    try {
      const { orderData, orderItems } = req.body;

      const responseOrder = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: "POST",
        headers: {
          ...supabaseHeaders,
          "Prefer": "return=representation"
        },
        body: JSON.stringify([orderData])
      });

      if (!responseOrder.ok) {
        const errText = await responseOrder.text();
        console.error("Order insertion failed:", errText);
        return res.status(responseOrder.status).json({ error: "Order insertion failed", details: errText });
      }

      const insertedOrders = await responseOrder.json();
      const order = insertedOrders[0];

      const orderId = order ? (order.id || order["id,"]) : null;

      if (!order || !orderId) {
        return res.status(500).json({ error: "No order ID returned" });
      }

      // Insert order items
      const itemsWithOrderId = orderItems.map((i: any) => ({
        order_id: orderId,
        product_name: i.product_name,
        price: i.price,
        quantity: i.quantity
      }));

      const responseItems = await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
        method: "POST",
        headers: {
          ...supabaseHeaders,
          "Prefer": "return=representation"
        },
        body: JSON.stringify(itemsWithOrderId)
      });

      if (!responseItems.ok) {
        const errText = await responseItems.text();
        console.error("Order items insertion failed:", errText);
        return res.status(responseItems.status).json({ error: "Order items insertion failed", details: errText });
      }

      return res.json({ success: true, order });
    } catch (err: any) {
      console.error("API Error in POST /api/orders:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // 4. POST /api/contacts
  app.post("/api/contacts", async (req, res) => {
    try {
      const contactData = req.body;
      const responseContact = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
        method: "POST",
        headers: {
          ...supabaseHeaders,
          "Prefer": "return=representation"
        },
        body: JSON.stringify([contactData])
      });

      if (!responseContact.ok) {
        const errText = await responseContact.text();
        console.error("Contact insertion failed:", errText);
        return res.status(responseContact.status).json({ error: "Contact insertion failed", details: errText });
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error("API Error in POST /api/contacts:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // Vite / static file serving
  const isBundled = typeof __dirname !== "undefined" && __dirname.includes("dist");
  let useVite = false;

  if (!isBundled && process.env.NODE_ENV !== "production") {
    try {
      await import("vite");
      useVite = true;
    } catch (e) {
      console.warn("Vite is not available in this environment. Falling back to static production mode serving.");
    }
  }

  if (useVite) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = isBundled 
      ? __dirname 
      : path.join(process.cwd(), "dist");

    console.log(`Production Mode: Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
