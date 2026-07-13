import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

const initialState = {
  cartItems: localStorage.getItem("cartItems") ? JSON.parse(localStorage.getItem("cartItems")) : [],
  cartTotalQuantity: 0,
  cartTotalAmount: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action) {
      const itemIndex = state.cartItems.findIndex((item) => item.id === action.payload.id);

      if (itemIndex >= 0) {
        state.cartItems[itemIndex].cartQuantity += 1;
        toast.info("Artan məhsul miqdarı", {
          position: "top-right",
        });
      } else {
        const defaultGrammage = "0.250kg";
        const tempProduct = {
          ...action.payload,
          cartQuantity: 1,
          grammage: defaultGrammage,
          price: action.payload.prices[defaultGrammage], 
        };
        state.cartItems.push(tempProduct);
        toast.success("Səbətə yeni məhsul əlavə edildi", {
          position: "top-right",
        });
      }

      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
    },
    removeFromCart(state, action) {
      const nextCartItems = state.cartItems.filter(
        (cartItem) => cartItem.id !== action.payload.id
      );

      state.cartItems = nextCartItems;
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));

      toast.error("Səbətdən çıxarıldı", {
        position: "top-right",
      });
    },
    decreaseCart(state, action) {
      const itemIndex = state.cartItems.findIndex(
        (cartItem) => cartItem.id === action.payload.id
      );

      if (state.cartItems[itemIndex].cartQuantity > 1) {
        state.cartItems[itemIndex].cartQuantity -= 1;

        toast.info("Məhsulun miqdarının azalması", {
          position: "top-right",
        });
      } else if (state.cartItems[itemIndex].cartQuantity === 1) {
        const nextCartItems = state.cartItems.filter(
          (cartItem) => cartItem.id !== action.payload.id
        );

        state.cartItems = nextCartItems;

        toast.error("Səbətdən çıxarıldı", {
          position: "top-right",
        });
      }
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
    },
    changeGrammage(state, action) {
      const { id, grammage } = action.payload;
      const itemIndex = state.cartItems.findIndex((cartItem) => cartItem.id === id);
      state.cartItems[itemIndex].grammage = grammage;
      state.cartItems[itemIndex].price = state.cartItems[itemIndex].prices[grammage];
      localStorage.setItem("cartItems", JSON.stringify(state.cartItems));
    },
    getTotals(state) {
      let { total, quantity } = state.cartItems.reduce((cartTotal, cartItem) => {
        const itemTotal = cartItem.price * cartItem.cartQuantity;
        cartTotal.total += itemTotal;
        cartTotal.quantity += cartItem.cartQuantity;
        return cartTotal;
      }, {
        total: 0,
        quantity: 0,
      });
      state.cartTotalQuantity = quantity;
      state.cartTotalAmount = total;
    },
    resetCart(state) {
      state.cartItems = [];
      state.cartTotalQuantity = 0;
      state.cartTotalAmount = 0;
      localStorage.removeItem("cartItems");
    },
  },
});

export const { addToCart, removeFromCart, decreaseCart, changeGrammage, getTotals, resetCart } = cartSlice.actions;

export default cartSlice.reducer;
