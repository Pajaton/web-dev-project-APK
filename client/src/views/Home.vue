<template>
  <div>
    <b-container fluid="md">
      <h1 class="display-5 fw-bold">Welcome to APK</h1>
      <p class="fs-4">Your friendly drinking buddy that will help you navigate through the night!</p>
      <BCarousel fade controls ride="carousel">
        <BCarouselSlide class="carousell_picture" :img-src="imageUrl('walkingMap.jpg')">
          <p class="fs-4 ">We help you find your closest systembolag</p>
        </BCarouselSlide>
        <BCarouselSlide class="carousell_picture" :img-src="imageUrl('toilet.jpg')">
          <p class="fs-4">We remind you to take toilet breaks and help you find the nearest public toilet.</p>
        </BCarouselSlide>
        <BCarouselSlide class="carousell_picture" :img-src="imageUrl('drinkingWine.jpg')">
          <p class="fs-4">We help you track your intake so you can moderate your drinking.</p>
        </BCarouselSlide>
        <BCarouselSlide class="carousell_picture" :img-src="imageUrl('friends.jpg')">
          <p class="fs-4">Connect with your friends and share your favorite drinks.</p>
        </BCarouselSlide>
      </BCarousel>
      <p class="fs-6">Remember to always drink responsibly</p>
      <BLink
        href="https://www.alkoholhjalpen.se/"
        target="_blank"
        rel="noopener"
        class="me-2"
      >
        www.alkoholhjalpen.se
      </BLink>

    </b-container>
  </div>
</template>

<script>
// @ is an alias to /src
import { Api } from '@/Api'

/**
 * @view Home
 * @description Landing page with welcome message, feature carousel,
 * and links to external resources.
 */
export default {
  name: 'home',
  data() {
    return {
      message: 'none'
    }
  },
  methods: {
    /**
     * @description Fetches a welcome message from the API.
     */
    getMessage() {
      Api.get('/')
        .then(response => {
          this.message = response.data.message
        })
        .catch(error => {
          this.message = error
        })
    },

    /**
     * @description Constructs the URL for a home page image asset.
     * @param {string} image - The image filename.
     * @returns {string} The full URL to the image.
     */
    imageUrl(image) {
      return new URL(`../assets/homePagePictures/${image}`, import.meta.url).href
    }
  }
}
</script>

<style>
.btn_message {
  margin-bottom: 1em;
}
.carousell_picture {
  max-height: 650px;
}
</style>
