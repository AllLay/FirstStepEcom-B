const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.productId");
    res.json(user.cart);
  } catch {
    res.status(500).json({ msg: "Failed to get cart" });
  }
});

router.post("/", auth, async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId) return res.status(400).json({ msg: "Missing productId" });

  try {
    const user = await User.findById(req.user._id);
    const index = user.cart.findIndex(item => item.productId.toString() === productId);

    if (index >= 0) {
      user.cart[index].quantity += quantity || 1;
    } else {
      user.cart.push({ productId, quantity: quantity || 1 });
    }

    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ msg: "Failed to update cart" });
  }
});

router.delete("/:productId", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { cart: { productId: req.params.productId } },
    });
    res.json({ msg: "Item removed" });
  } catch {
    res.status(500).json({ msg: "Failed to remove item" });
  }
});

router.delete("/", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });
    res.json({ msg: "Cart cleared" });
  } catch {
    res.status(500).json({ msg: "Failed to clear cart" });
  }
});

module.exports = router;