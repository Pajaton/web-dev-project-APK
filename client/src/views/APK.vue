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
                    <button @click="closeDrinkPopup">Close</button>
                    <button class="review-button" @click="openReviewPopup(); getReviewRating();">Review drink</button>
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
                        <div class="review-buttons">
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
      mockUserId: '69315df03496883746342df8',
      oldReview: null
    }
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
    openReviewPopup(drink) {
      this.showReviewPopup = true
      this.showDrinkPopup = false
    },
    closeReviewPopup() {
      this.showReviewPopup = false
      console.log(this.showReviewPopup)
    },
    getReviewRating() {
      drinkApi.get('/users/' + this.mockUserId + '/drinks/' + this.chosenDrink._id + '/reviews')
        .then(response => {
        //  random comment for new git push, pipeline issue
          const reviews = response.data.reviews || []
          if (reviews.length === 0) {
            this.oldReview = null
          } else {
            this.oldReview = reviews[0]
          }
        })
        .catch(error => {
          this.message = error
        })
    },
    sendReviewRating() {
      drinkApi.post('/reviews', {
        // Change the mock data for the user who is currently logged in.
        userID: this.mockUserId,
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
        userID: this.mockUserId,
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
          console.log('Review deleted:', response.data)
          this.oldReview = null
          this.reviewText = ''
          this.rating = null
          this.showReviewPopup = false
        })
        .catch(error => {
          this.message = error
        })
    }
  }
}
</script>

<style>
    .filter-list label {
        align-items: center;
        gap: 0.5rem;
    }
    .filter-list {
        list-style: none;
        text-align: left;
    }
    .filter-list li {
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
    .filter-button {
        margin-left: 2rem;
        display: block;
    }
    .sort-button {
        margin-left: 2rem;
        display: block;
    }
    .sort-list {
        list-style: none;
    }
    .sort-list li {
        text-align: left;
    }
    .popup-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: flex-start;
        justify-content: center;
    }
    .drink-popup {
        background: white;
        padding: 2rem;
        text-align: left;
    }
    .review-popup {
        background: white;
        padding: 2rem;
        text-align: left;
        width: 60%;
        max-width: 700px;
        min-height: 50vh;
        box-sizing: border-box;
    }
    .review-button {
        margin-left: 20rem
    }
    .review-buttons {
        display: flex;
    }
    .close-review-button {
        margin-left: auto;
    }
    .review-input-field {
        width: 60%;
        height: 80px;
    }
    .rating-label {
        margin-right: 20px
    }
    .delete-review-button {
      margin-left: 1rem;
    }
</style>
