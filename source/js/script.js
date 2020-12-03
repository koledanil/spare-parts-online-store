"use strict";

const burgerMenuOpenBtn = document.querySelector(".bobs-burger-menu");
const burgerMenu = document.querySelector(".modal-bg");
const burgerMenuCloseBtn = document.querySelector(".close-burger-menu");

const openMenuHandler = function () {
  burgerMenu.classList.remove("visually-hidden");

  burgerMenuCloseBtn.addEventListener("click", closeMenuHandler);
  burgerMenu.addEventListener("click", closeMenuHandler);
};

const closeMenuHandler = function (evt) {
  burgerMenu.classList.add("visually-hidden");

  burgerMenuCloseBtn.removeEventListener("click", closeMenuHandler);
  burgerMenu.removeEventListener("click", closeMenuHandler);
};

burgerMenuOpenBtn.addEventListener("click", openMenuHandler);
