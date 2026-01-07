<template>
  <div>
    <b-container>
      <b-row>
        <!-- Filters -->
        <b-col cols="12" md="6">
          <b-card>
            <h1>Filter drinks:</h1>

            <b-form @submit.prevent="submitFilter">
              <!-- Type -->
              <b-form-group>
                <b-form-checkbox v-model="selectedFilter" value="type">
                  <h4>Type of beverage</h4>
                </b-form-checkbox>
                <b-card-body v-if="selectedFilter.includes('type')">
                  <b-form-checkbox-group v-if="selectedFilter.includes('type')" v-model="selectedType" stacked>
                    <b-form-checkbox value="beer">Beer</b-form-checkbox>
                    <b-form-checkbox value="wine">Wine</b-form-checkbox>
                    <b-form-checkbox value="cider">Cider</b-form-checkbox>
                    <b-form-checkbox value="sprit">Sprit</b-form-checkbox>
                  </b-form-checkbox-group>
                </b-card-body>
              </b-form-group>

              <!-- Percentage -->
              <b-form-group>
                <b-form-checkbox v-model="selectedFilter" value="percentage">
                  <h4>Alcohol percentage</h4>
                </b-form-checkbox>
                <div v-if="selectedFilter.includes('percentage')">
                  Min %
                  <b-form-input type="number" v-model="percentageMinText"/>
                  Max %
                  <b-form-input type="number" v-model="percentageMaxText"/>
                </div>
              </b-form-group>

              <!-- Price -->
              <b-form-group>
                <b-form-checkbox v-model="selectedFilter" value="price">
                  <h4>Price</h4>
                </b-form-checkbox>
                <div v-if="selectedFilter.includes('price')">
                  Minimum price
                  <b-form-input type="number" v-model="priceMinText"/>
                  Maximum price
                  <b-form-input type="number" v-model="priceMaxText"/>
                </div>
              </b-form-group>

              <!-- APK -->
              <b-form-group>
                <b-form-checkbox v-model="selectedFilter" value="apk">
                  <h4>Minimum APK</h4>
                </b-form-checkbox>
                <b-form-input v-if="selectedFilter.includes('apk')" type="number" v-model="apkMinText"/>
              </b-form-group>
              <b-button type="submit">
                Apply filters
              </b-button>
            </b-form>
          </b-card>
        </b-col>

        <!-- Sorting -->
        <b-col cols="12" md="6">
          <b-card>
            <h1>Sort drinks:</h1>
            <b-form @submit.prevent="submitSort">
              <b-form-radio-group v-model="selectedSort" stacked>
                <b-form-radio value="productNumber">Product number</b-form-radio>
                <b-form-radio value="name">Name</b-form-radio>
                <b-form-radio value="type">Type</b-form-radio>
                <b-form-radio value="container">Container</b-form-radio>
                <b-form-radio value="volume">Volume</b-form-radio>
                <b-form-radio value="percentage">Percentage</b-form-radio>
                <b-form-radio value="colour">Colour</b-form-radio>
                <b-form-radio value="price">Price</b-form-radio>
                <b-form-radio value="apk">APK</b-form-radio>
              </b-form-radio-group>

              <b-button type="submit">
                Apply sort
              </b-button>

              <b-button v-if="currentUserEmail === 'admin@apk.com'" variant="danger" @click="deleteAllReviews">
                DELETE ALL REVIEWS
              </b-button>
            </b-form>
          </b-card>
        </b-col>

        <!-- Drink list -->
        <b-col cols="12">
          <b-card>
            <b-list-group>
              <b-list-group-item v-for="drink in drinks" :key="drink._id" button @click="openDrinkPopup(drink)">
                {{ drink.name }}
              </b-list-group-item>
            </b-list-group>
          </b-card>
        </b-col>
      </b-row>
    </b-container>

    <!-- Drink details -->
    <b-modal v-model="showDrinkPopup" title="Drink details" hide-footer>
      <div v-if="chosenDrink">
        <h2>{{ chosenDrink.name }}</h2>
        <b-row>
          <b-col cols="12" md="6">
            <p><strong>Product number:</strong> {{ chosenDrink.productNumber }}</p>
            <p><strong>Type:</strong> {{ chosenDrink.type }}</p>
            <p><strong>Container:</strong> {{ chosenDrink.container }}</p>
            <p><strong>Volume:</strong> {{ chosenDrink.volume }} ml</p>
            <p><strong>Alcohol percentage:</strong> {{ chosenDrink.percentage }} %</p>
            <p><strong>Price:</strong> {{ chosenDrink.price }} kr</p>
            <p><strong>APK:</strong> {{ chosenDrink.apk }}</p>
            <p><strong>Colour:</strong> {{ chosenDrink.colour }}</p>
            <p><strong>Average Rating:</strong> {{ avgRating }}</p>
          </b-col>
          <b-col cols="12" md="6">
            <b-img :src= chosenDrink.image fluid alt="bottle image"  style="max-width: 230px; max-height: 300px; display:block;" @error="drinkPictureError"></b-img>
          </b-col>
        </b-row>
        <b-button v-if="currentUserId" @click="getReviewRating">
          Review drink
        </b-button>

        <b-button @click="getAllReviewRating">
          Check reviews
        </b-button>

        <b-button @click="closeDrinkPopup">
          Close
        </b-button>
      </div>
    </b-modal>

    <!-- All reviews -->
    <b-modal v-model="showAllReviewsPopup" title="Reviews" hide-footer>
      <div v-for="(review, index) in reviewsForChosenDrink" :key="index">
        <h4>Review number: {{ index + 1 }}</h4>
        <p>Reviewer: {{ review.userName }}</p>
        <p>Rating: {{ review.rating }}</p>
        <p>Comment: {{ review.comment }}</p>
      </div>

      <b-button @click="closeAllReviewsPopup">
        Close
      </b-button>
    </b-modal>

    <!-- Review -->
    <b-modal v-model="showReviewPopup" title="Review drink" hide-footer>
      <b-form-group label="Comment on the drink:">
        <b-form-textarea v-model="reviewText" />
      </b-form-group>

      <b-form-group label="Rating">
        <b-form-radio-group v-model="rating">
          <b-form-radio value="1">1</b-form-radio>
          <b-form-radio value="2">2</b-form-radio>
          <b-form-radio value="3">3</b-form-radio>
          <b-form-radio value="4">4</b-form-radio>
          <b-form-radio value="5">5</b-form-radio>
        </b-form-radio-group>
      </b-form-group>

      <b-button v-if="!oldReview" @click="sendReviewRating">
        Add review
      </b-button>

      <b-button v-if="oldReview" @click="updateReviewRating">
        Update your review
      </b-button>

      <b-button v-if="oldReview" variant="danger" @click="deleteReview">
        Delete review
      </b-button>

      <b-button @click="closeReviewPopup">
        Close
      </b-button>
    </b-modal>
  </div>
</template>

<script>

import { Api } from '@/Api'

/**
 * @view APK
 * @description Main drinks listing page with filtering, sorting, and review functionality.
 * Displays all available drinks from Systembolaget with APK (alcohol per krona) calculations.
 */
export default {
  name: 'APK',
  data() {
    return {
      message: 'none',
      drinks: [],
      selectedFilter: [],
      selectedSort: '',
      selectedType: [],
      percentageMinText: '',
      priceMinText: '',
      apkMinText: '',
      percentageMaxText: '',
      priceMaxText: '',
      showDrinkPopup: false,
      chosenDrink: null,
      showReviewPopup: false,
      reviewText: '',
      rating: null,
      currentUserId: null,
      currentUserEmail: null,
      oldReview: null,
      allReviews: null,
      reviewsForChosenDrink: [],
      showAllReviewsPopup: false,
      avgRating: null
    }
  },
  mounted() {
    this.fetchCurrentUser()
    this.getDrinklist('')
  },
  methods: {
    /**
     * @description Fetches the list of drinks from the API with optional filters.
     * @param {string} filterUrl - Query string with filter/sort parameters.
     */
    getDrinklist(filterUrl) {
      Api.get('/drinks/' + filterUrl)
        .then(response => {
          this.drinks = response.data.drinks
        })
        .catch(error => {
          this.message = error
        })
    },

    /**
     * @description Fetches a single drink by its ID.
     * @param {string} id - The drink's ID.
     */
    getDrinkById(id) {
      Api.get('/drinks/' + id)
        .then(response => {
          this.chosenDrink = response.data
        })
        .catch(error => {
          this.message = error
        })
    },

    /**
     * @description Builds a query string from selected filters and sort options.
     * @returns {string} The constructed query string for the API request.
     */
    buildQuery() {
      let query = ''
      if (this.selectedType.length) {
        this.selectedType.forEach((type, index) => {
          let prefix
          if (index === 0) {
            prefix = '?'
          } else {
            prefix = '&'
          }
          query += `${prefix}type=${this.capitalizeFirst(type)}`
        })
      }
      if (this.selectedFilter.includes('percentage') && this.percentageMinText) {
        if (query === '') {
          query += '?'
        } else {
          query += '&'
        }
        query += 'percentageMin=' + this.percentageMinText
      }
      if (this.selectedFilter.includes('percentage') && this.percentageMaxText) {
        if (query === '') {
          query += '?'
        } else {
          query += '&'
        }
        query += 'percentageMax=' + this.percentageMaxText
      }
      if (this.selectedFilter.includes('price') && this.priceMinText) {
        if (query === '') {
          query += '?'
        } else {
          query += '&'
        }
        query += 'priceMin=' + this.priceMinText
      }
      if (this.selectedFilter.includes('price') && this.priceMaxText) {
        if (query === '') {
          query += '?'
        } else {
          query += '&'
        }
        query += 'priceMax=' + this.priceMaxText
      }
      if (this.selectedFilter.includes('apk') && this.apkMinText) {
        if (query === '') {
          query += '?'
        } else {
          query += '&'
        }
        query += 'apkMin=' + this.apkMinText
      }
      if (this.selectedSort) {
        if (query === '') {
          query += '?'
        } else {
          query += '&'
        }
        query += 'sort=' + this.selectedSort
      }
      return query
    },

    /**
     * @description Applies the selected filters and fetches filtered drink list.
     */
    submitFilter() {
      const query = this.buildQuery()
      this.getDrinklist(query)
    },

    /**
     * @description Applies the selected sort option and fetches sorted drink list.
     */
    submitSort() {
      const query = this.buildQuery()
      this.getDrinklist(query)
    },

    /**
     * @description Capitalizes the first letter of a string.
     * @param {string} str - The string to capitalize.
     * @returns {string} The capitalized string.
     */
    capitalizeFirst(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    },

    /**
     * @description Opens the drink details popup and fetches average rating.
     * @param {Object} drink - The drink object to display.
     */
    async openDrinkPopup(drink) {
      this.showDrinkPopup = true
      this.getDrinkById(drink._id)
      this.avgRating = await this.getAverageScore(drink._id)
    },

    /**
     * @description Closes the drink details popup.
     */
    closeDrinkPopup() {
      this.showDrinkPopup = false
      this.chosenDrink = null
    },

    /**
     * @description Opens the review popup for the current drink.
     */
    openReviewPopup() {
      this.showReviewPopup = true
      this.showDrinkPopup = false
      if (this.oldReview) {
        this.reviewText = this.oldReview.comment
        this.rating = this.oldReview.rating
      } else {
        this.reviewText = ''
        this.rating = null
      }
    },

    /**
     * @description Closes the review popup.
     */
    closeReviewPopup() {
      this.showReviewPopup = false
    },

    /**
     * @description Closes the all reviews popup.
     */
    closeAllReviewsPopup() {
      this.showAllReviewsPopup = false
    },

    /**
     * @description Fetches the current user's existing review for the chosen drink.
     */
    getReviewRating() {
      Api.get('/users/' + this.currentUserId + '/drinks/' + this.chosenDrink._id + '/reviews')
        .then(response => {
          const reviews = response.data.reviews || []
          if (reviews.length === 0) {
            this.oldReview = null
          } else {
            this.oldReview = reviews[0]
          }

          this.openReviewPopup()
        })
        .catch(error => {
          this.message = error
        })
    },

    /**
     * @description Submits a new review for the chosen drink.
     */
    sendReviewRating() {
      Api.post('/reviews', {
        userID: this.currentUserId,
        productID: this.chosenDrink._id,
        rating: this.rating,
        comment: this.reviewText
      })
        .then(() => {
          this.reviewText = ''
          this.rating = null
          this.showReviewPopup = false
        })
        .catch(error => {
          this.message = error
        })
    },

    /**
     * @description Updates an existing review for the chosen drink.
     */
    updateReviewRating() {
      Api.put('/reviews/' + this.oldReview._id, {
        userID: this.currentUserId,
        productID: this.chosenDrink._id,
        rating: this.rating,
        comment: this.reviewText
      })
        .then(() => {
          this.reviewText = ''
          this.rating = null
          this.showReviewPopup = false
        })
        .catch(error => {
          this.message = error
        })
    },

    /**
     * @description Deletes the current user's review for the chosen drink.
     */
    deleteReview() {
      if (!this.oldReview) {
        return
      }
      Api.delete('/reviews/' + this.oldReview._id)
        .then(() => {
          this.oldReview = null
          this.reviewText = ''
          this.rating = null
          this.showReviewPopup = false
        })
        .catch(error => {
          this.message = error
        })
    },

    /**
     * @description Deletes all reviews (admin only).
     */
    deleteAllReviews() {
      Api.delete('/reviews')
        .then(() => {
          this.showReviewPopup = false
        })
        .catch(error => {
          this.message = error
        })
    },

    /**
     * @description Fetches all reviews for the chosen drink and displays them.
     */
    getAllReviewRating() {
      this.showAllReviewsPopup = true
      this.reviewsForChosenDrink = []
      Api.get('/reviews')
        .then(response => {
          this.allReviews = response.data.review

          this.allReviews.forEach(review => {
            if (review.productID === this.chosenDrink._id) {
              /* Store names and review/rating of the people who have done reviews on the chosen drink */
              Api.get('/users/' + review.userID)
                .then(response => {
                  this.user = response.data
                  this.reviewsForChosenDrink.push({
                    userName: this.user.userName,
                    comment: review.comment,
                    rating: review.rating
                  })
                })
                .catch(error => {
                  this.message = error
                  this.reviewsForChosenDrink.push({
                    userName: 'Account deleted',
                    comment: review.comment,
                    rating: review.rating
                  })
                })
            }
          })
        })
        .catch(error => {
          this.message = error
        })
    },

    /**
     * @description Calculates the average rating score for a drink.
     * @param {string} drink - The drink's ID.
     * @returns {number|string} The average score or 'No score' if no reviews.
     */
    async getAverageScore(drink) {
      let avgScore = 0
      try {
        const response = await Api.get('/drinks/' + drink + '/reviews')
        const drinkReviews = response.data.reviewForDrink
        let reviewCounter = 0
        let totalScore = 0
        for (const review of drinkReviews) {
          if (review.rating != null) {
            reviewCounter += 1
            totalScore += review.rating
          }
          if (reviewCounter > 0) {
            avgScore = totalScore / reviewCounter
          } else {
            avgScore = 'No score'
          }
        }
      } catch (error) {
        this.message = error
      }
      return avgScore
    },

    /**
     * @description Fetches the currently logged-in user's ID and email.
     */
    fetchCurrentUser() {
      Api.get('/sessions/currentlyLoggedin/')
        .then(response => {
          this.currentUserId = response.data.user._id
          this.currentUserEmail = response.data.user.email
        })
        .catch(error => {
          this.message = error
        })
    },

    /**
     * @description Handles image load error by setting default drink picture.
     * @param {Event} event - The error event.
     */
    drinkPictureError(event) {
      event.target.src = this.imageUrl('default_drink.jpg')
    },

    /**
     * @description Constructs the URL for a drink image asset.
     * @param {string} image - The image filename.
     * @returns {string} The full URL to the image.
     */
    imageUrl(image) {
      return new URL(`../assets/drinkPictures/${image}`, import.meta.url).href
    }
  }
}
</script>

<style>

</style>
