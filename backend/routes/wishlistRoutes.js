const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const axios = require('axios');
const cheerio = require('cheerio');
const Razorpay = require('razorpay'); // Razorpay import kiya

// --- RAZORPAY CONFIG (Apni Keys Yahan Daalo) ---
const razorpay = new Razorpay({
  key_id: 'rzp_test_XXXXXXXXXXXXXX', // Dashboard se lein
  key_secret: 'XXXXXXXXXXXXXX',      // Dashboard se lein
});

// --- 1. HD MULTI-SOURCE SEARCH ---
router.get('/search-products', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Search term chahiye bhai!" });

  try {
    const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(q)}`;
    
    const { data } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const $ = cheerio.load(data);
    const products = [];
    const platforms = [
      { name: 'Myntra', color: '#ff3f6c' },
      { name: 'Savana', color: '#000000' },
      { name: 'Amazon', color: '#FF9900' }
    ];

    $('.s-result-item[data-component-type="s-search-result"], .s-card-container').each((i, el) => {
      if (products.length < 15) {
        const title = $(el).find('h2 span, .a-size-medium, .a-size-base-plus').first().text().trim();
        let image = $(el).find('img.s-image').attr('src');
        const priceRaw = $(el).find('.a-price-whole').first().text().replace(/[,.]/g, '');
        const rating = $(el).find('.a-icon-alt').text().split(' ')[0] || (Math.random() * (5 - 4) + 4).toFixed(1);

        if (title && image && priceRaw) {
          image = image.replace(/\._AC_.*_\./, '.').replace(/\._SR.*_\./, '.');
          const platformInfo = platforms[products.length % platforms.length];
          
          products.push({
            id: `real_${i}_${Date.now()}`,
            title: title.substring(0, 60),
            brand: title.split(' ')[0].toUpperCase(),
            image,
            price: parseInt(priceRaw),
            rating: parseFloat(rating),
            platform: platformInfo.name,
            platformColor: platformInfo.color,
            discount: Math.floor(Math.random() * (55 - 15) + 15) 
          });
        }
      }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Shopping data fetch failed" });
  }
});

// --- 2. PAYMENT: ORDER CREATE (Razorpay) ---
router.post('/checkout', async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: Number(amount * 100), // Paise mein
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: "Razorpay order failed" });
  }
});

// --- 3. PAYMENT: VERIFY & UPDATE WISHLIST ---
router.post('/verify', async (req, res) => {
  try {
    const { itemId } = req.body;
    
    // Agar item wishlist se kharida ja raha hai (uske paas _id hai)
    if (itemId) {
      await Wishlist.findByIdAndUpdate(itemId, { isBought: true });
      return res.json({ success: true, message: "Marked as bought!" });
    }
    
    res.json({ success: true, message: "Simulated success!" });
  } catch (err) {
    res.status(500).json({ error: "Update fail ho gaya" });
  }
});
// --- 4. EXISTING ROUTES ---
router.get('/:roomId', async (req, res) => {
  try {
    const items = await Wishlist.find({ roomId: req.params.roomId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Wishlist load nahi ho payi" });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { roomId, addedBy, title, link, imageUrl, price, priority, category, platform } = req.body;
    const newItem = new Wishlist({ 
      roomId, addedBy, title, link, imageUrl, price, 
      priority: priority || 'Normal', 
      category: category || platform || 'General' 
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Item add nahi ho paya" });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    await Wishlist.findByIdAndDelete(req.params.id);
    res.json({ message: "Item uda diya gaya!" });
  } catch (err) {
    res.status(500).json({ error: "Delete fail ho gaya" });
  }
});

module.exports = router;