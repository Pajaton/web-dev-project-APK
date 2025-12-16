<template>
    <div>
        <form @submit.prevent="submitFilter">
            <ul class="filter-list">
                <h1>Filter drinks:</h1>
                <li>
                    <label>
                        <input
                            type="checkbox" name="drink-filter" value="type" v-model="selectedFilter">
                            Type of beverage
                        <div v-if="selectedFilter.includes('type')" class="sub-filter">
                            <label>
                                <input type="checkbox" name="drink" value="beer" v-model="selectedType">
                                    Beer
                            </label>
                            <label>
                                <input type="checkbox" name="drink" value="wine" v-model="selectedType">
                                    Wine
                            </label>
                            <label>
                                <input type="checkbox" name="drink" value="cider" v-model="selectedType">
                                    Cider
                            </label>
                            <label>
                                <input type="checkbox" name="drink" value="sprit" v-model="selectedType">
                                    Sprit
                            </label>
                        </div>
                    </label>
                </li>
                <li>
                    <label>
                        <input  type="checkbox" name="drink-filter"  value="percentage" v-model="selectedFilter">
                            Alcohol percentage
                        <div v-if="selectedFilter.includes('percentage')" class="sub-filter">
                            <input type="number" min="0" max="100" step="0.1" v-model="percentageText">
                            {{ percentageText }} %
                        </div>
                    </label>
                </li>
                <li>
                    <label>
                        <input type="checkbox" name="drink-filter" value="price" v-model="selectedFilter">
                            Price
                        <div v-if="selectedFilter.includes('price')" class="sub-filter">
                            <input type="number" min="0" max="100" step="0.1" v-model="priceText">
                            {{ priceText }} kr
                        </div>
                    </label>
                </li>
                <li>
                    <label>
                        <input type="checkbox" name="drink-filter" value="apk" v-model="selectedFilter">
                            Alcohol per krona (krona per 1 ml of 100% alcohol)
                        <div v-if="selectedFilter.includes('apk')" class="sub-filter">
                            <input type="number" min="0" max="100" step="0.1" v-model="apkText">
                            {{ apkText }} kr
                        </div>
                    </label>
                </li>
            </ul>
            <div>
                <button type="submit" class="filter-button">Apply filters</button>
            </div>
        </form>
        <form @submit.prevent="submitSort">
            <ul class="sort-list">
                <li>
                    <h1>Sort drinks:</h1>
                    <input type="radio" name="drink-sort" value="productNumber" v-model="selectedSort">
                        Product number
                </li>
                <li>
                    <input type="radio" name="drink-sort" value="name" v-model="selectedSort">
                        Name
                </li>
                <li>
                    <input type="radio" name="drink-sort" value="type" v-model="selectedSort">
                        Type
                </li>
                <li>
                    <input type="radio" name="drink-sort" value="container" v-model="selectedSort">
                        Container
                </li>
                <li>
                    <input type="radio" name="drink-sort" value="volume" v-model="selectedSort">
                        Volume
                </li>
                <li>
                    <input type="radio" name="drink-sort" value="percentage" v-model="selectedSort">
                        Percentage
                </li>
                <li>
                    <input type="radio" name="drink-sort" value="colour" v-model="selectedSort">
                        Colour
                </li>
                <li>
                    <input type="radio" name="drink-sort" value="price" v-model="selectedSort">
                        Price
                </li>
                <li>
                    <input type="radio" name="drink-sort" value="apk" v-model="selectedSort">
                        APK
                </li>
            </ul>
            <div>
                <button type="submit" class="sort-button">Apply sort</button>
                <button class="delete-all-reviews-button" @click="deleteAllReviews()"> <strong>DELETE ALL REVIEWS</strong></button>
            </div>
        </form>
            <ul class="drinks-list">
                <li v-for="drink in drinks" :key="drink._id">
                    <a href="#" class="drink-link" @click.prevent="openDrinkPopup(drink)">
                        {{ drink.name }}
                    </a>
                </li>
            </ul>
            <div v-if="showDrinkPopup" class="popup-overlay">
                <div class="drink-popup">
                    <div v-if="chosenDrink">
                        <h2>{{ chosenDrink.name }}</h2>

                        <p><strong>Product number:</strong> {{ chosenDrink.productNumber }}</p>
                        <p><strong>Type:</strong> {{ chosenDrink.type }}</p>
                        <p><strong>Container:</strong> {{ chosenDrink.container }}</p>
                        <p><strong>Volume:</strong> {{ chosenDrink.volume }} ml</p>
                        <p><strong>Alcohol percentage:</strong> {{ chosenDrink.percentage }} %</p>
                        <p><strong>Price:</strong> {{ chosenDrink.price }} kr</p>
                        <p><strong>APK:</strong> {{ chosenDrink.apk }}</p>
                        <p><strong>Colour:</strong> {{ chosenDrink.colour }}</p>
                    </div>
                    <div class="popup-buttons">
                      <button class="review-button" v-if="currentUserId" @click="getReviewRating();">Review drink</button>
                      <button class="check-reviews-button" @click="getAllReviewRating();">Check reviews</button>
                      <button @click="closeDrinkPopup">Close</button>
                    </div>
                </div>
            </div>
            <div v-if="showAllReviewsPopup" class="popup-overlay">
              <div class="review-popup">
                <div class="all-reviews" v-for="(review, index) in reviewsForChosenDrink" :key="index">
                  <h4>Review number: {{index+1}}</h4>
                  <p>Reviewer: {{ review.userName }}</p>
                  <p>Rating: {{ review.rating }}</p>
                  <p>Comment: {{ review.comment }}</p>
                </div>
                <button class="close-review-button" @click="closeAllReviewsPopup">Close</button>
              </div>
            </div>
            <div v-if="showReviewPopup" class="popup-overlay">
                <div class="review-popup">
                    <div>
                        <h5>Comment on the drink: </h5>
                            <textarea class="review-input-field" type="text" placeholder="Write your review" v-model="reviewText"></textarea>
                    </div>
                    Rating
                        <p>
                            <label class="rating-label">
                                1
                                <input type="radio" name="rating" value="1" v-model="rating">
                            </label>
                            <label class="rating-label">
                                2
                                <input type="radio" name="rating" value="2" v-model="rating">
                            </label>
                            <label class="rating-label">
                                3
                                <input type="radio" name="rating" value="3" v-model="rating">
                            </label>
                            <label class="rating-label">
                                4
                                <input type="radio" name="rating" value="4" v-model="rating">
                            </label>
                            <label class="rating-label">
                                5
                                <input type="radio" name="rating" value="5" v-model="rating">
                            </label>
                        </p>
                        <div class="popup-buttons">
                            <button v-if="!oldReview" class="submit-review-button" @click="sendReviewRating()">Add review</button>
                            <button v-if="oldReview" class="submit-review-button" @click="updateReviewRating()">Update your review</button>
                            <button v-if="oldReview" class="delete-review-button" @click="deleteReview">Delete review</button>
                            <button class="close-review-button" @click="closeReviewPopup">Close</button>
                        </div>
                </div>
            </div>
    </div>
</template>

<script>

import { drinkApi } from '@/Api'

export default {
  name: 'APK',
  data() {
    return {
      message: 'none',
      drinks: [],
      selectedFilter: [],
      selectedSort: '',
      selectedType: [],
      typeText: '',
      percentageText: '',
      priceText: '',
      apkText: '',
      showDrinkPopup: false,
      chosenDrink: null,
      showReviewPopup: '',
      reviewText: '',
      rating: null,
      /* When testing functionality with user, check for a user in your current database, and paste the _id-number in the mock user variable */
      currentUserId: null,
      oldReview: null,
      allReviews: null,
      reviewsForChosenDrink: [],
      showAllReviewsPopup: false
    }
  },
  mounted() {
    this.fetchCurrentUser()
  },
  methods: {
    getDrinklist(filterUrl) {
      drinkApi.get('/drinks/' + filterUrl)
        .then(response => {
          this.drinks = response.data.drinks
        })
        .catch(error => {
          this.message = error
        })
    },
    getDrinkById(id) {
      drinkApi.get('/drinks/' + id)
        .then(response => {
          this.chosenDrink = response.data
        })
        .catch(error => {
          this.message = error
        })
    },
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
      if (this.selectedFilter.includes('percentage') && this.percentageText) {
        if (query === '') {
          query += '?'
        } else {
          query += '&'
        }
        query += 'percentage=' + this.percentageText
      }
      if (this.selectedFilter.includes('price') && this.priceText) {
        if (query === '') {
          query += '?'
        } else {
          query += '&'
        }
        query += 'price=' + this.priceText
      }
      if (this.selectedFilter.includes('apk') && this.apkText) {
        if (query === '') {
          query += '?'
        } else {
          query += '&'
        }
        query += 'apk=' + this.apkText
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
    submitFilter() {
      const query = this.buildQuery()
      this.getDrinklist(query)
    },
    submitSort() {
      const query = this.buildQuery()
      this.getDrinklist(query)
    },
    capitalizeFirst(str) {
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    },
    openDrinkPopup(drink) {
      this.showDrinkPopup = true
      this.getDrinkById(drink._id)
    },
    closeDrinkPopup() {
      this.showDrinkPopup = false
      this.chosenDrink = null
    },
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
    closeReviewPopup() {
      this.showReviewPopup = false
    },
    closeAllReviewsPopup() {
      this.showAllReviewsPopup = false
    },
    getReviewRating() {
      drinkApi.get('/users/' + this.currentUserId + '/drinks/' + this.chosenDrink._id + '/reviews')
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
    sendReviewRating() {
      drinkApi.post('/reviews', {
        // Change the mock data for the user who is currently logged in.
        userID: this.currentUserId,
        productID: this.chosenDrink._id,
        rating: this.rating,
        comment: this.reviewText
      })
      console.log('Review added: ' + this.reviewText + ' ' + ' Rating: ' + this.rating)
      this.reviewText = ''
      this.rating = null
      this.showReviewPopup = false
    },
    updateReviewRating() {
      drinkApi.put('/reviews/' + this.oldReview._id, {
        userID: this.currentUserId,
        productID: this.chosenDrink._id,
        rating: this.rating,
        comment: this.reviewText
      })
      console.log('Review updated: ' + this.reviewText + ' ' + ' Rating: ' + this.rating)
      this.reviewText = ''
      this.rating = null
      this.showReviewPopup = false
    },
    deleteReview() {
      if (!this.oldReview) {
        return
      }
      drinkApi.delete('/reviews/' + this.oldReview._id)
        .then(response => {
          this.oldReview = null
          this.reviewText = ''
          this.rating = null
          this.showReviewPopup = false
        })
        .catch(error => {
          this.message = error
        })
    },
    deleteAllReviews() {
      drinkApi.delete('/reviews')
        .then(response => {
          this.showReviewPopup = false
        })
        .catch(error => {
          this.message = error
        })
    },
    getAllReviewRating() {
      this.showAllReviewsPopup = true
      this.reviewsForChosenDrink = []
      drinkApi.get('/reviews')
        .then(response => {
          this.allReviews = response.data.review

          this.allReviews.forEach(review => {
            if (review.productID === this.chosenDrink._id) {
              /* Store names and review/rating of the people who have done reviews on the chosen drink */
              drinkApi.get('/users/' + review.userID)
                .then(response => {
                  this.user = response.data
                  this.reviewsForChosenDrink.push({
                    userName: this.user.userName,
                    comment: review.comment,
                    rating: review.rating
                  })
                })
                .catch(err => {
                  console.error('User fetch failed', err)
                  this.reviewsForChosenDrink.push({
                    userName: 'Account deleted',
                    comment: review.comment,
                    rating: review.rating
                  })
                })
            }
          })
        })
        .catch(err => {
          console.error('Reviews fetch failed', err)
        })
    },
    fetchCurrentUser() {
      drinkApi.get('/sessions/currentlyLoggedin/')
        .then(response => {
          this.currentUserId = response.data.user._id
          console.log(this.currentUserId)
        })
        .catch(error => {
          this.message = error
        })
    }
  }
}
</script>

<style>
    .sort-list,
    .filter-list {
      list-style: none;
      text-align: left;
    }
    .drinks-list {
      margin-top: 1rem;
      padding-left: 2rem;
      list-style: none;
      text-align: left;
    }

    .sub-filter {
      margin-left: 2rem;
      margin-top: 0.25rem;
    }
    .sub-filter label {
      margin-right: 1rem;
    }
    .sort-button,
    .filter-button {
      margin-left: 2rem;
      display: block;
    }

    .popup-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    .drink-popup,
    .review-popup {
      background: white;
      padding: 2rem;
      text-align: left;
      width: 32%;
      box-sizing: border-box;
    }
    .review-buttons {
      display: flex;
    }
    .review-input-field {
      width: 60%;
      height: 80px;
    }
    .rating-label {
      margin-right: 20px
    }
    .delete-all-reviews-button {
      color: red;
    }
    .popup-buttons {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .all-reviews {
      margin-top: 2rem;
    }

  /* Iphone 14 pro max media query */
  @media (max-width: 500px) {

  .filter-list {
    margin-left: 5px;
    padding-left: 0;
  }
  .drinks-list {
    margin-left: 5px;
    padding-left: 0;
  }
  .sub-filter {
    margin-left: 5px;
    padding-left: 0;
  }
  .filter-button {
    margin-left: 5px;
    text-align: center;
  }
  .sort-button {
    margin-left: 5px;
    text-align: center;
  }
  .drink-popup {
    width: 90%;
    padding: 1rem;
    margin-top: 7rem;
  }
  .review-popup {
    width: 80%;
    padding: 0.7rem;
    margin-top: 9rem;
  }
  .review-input-field {
    width: 100%;
  }
  .review-buttons {
    gap: 0.5rem;
    padding-top: 20px;
  }
  .sort-list {
    padding-top: 5px;
    margin-left: -26px;
  }
}
</style>
