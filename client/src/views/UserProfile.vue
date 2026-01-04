<template>
  <div>
    <div v-if="user">
      <b-img :src="user.profilePicture" fluid alt="Profile Picture" class="profile-picture" @error="profilePictureError"></b-img>
        <b-card style="max-width: 400px" horizontal header="User Info">
          <b-list-group >
            <b-list-group-item flush variant="primary">Username: {{user.userName}}</b-list-group-item>
            <b-list-group-item flush variant="primary">Email: {{user.email}}</b-list-group-item>
            <b-list-group-item flush variant="primary">Adress: {{user.street}} {{ user.streetNumber}}</b-list-group-item>
            <b-list-group-item flush variant="primary">Postal code: {{user.postalCode}}</b-list-group-item>
            <b-list-group-item flush variant="primary">City: {{user.city}}</b-list-group-item>
            <b-list-group-item flush variant="primary">Following: {{user.follows.length}} people</b-list-group-item>
            <b-list-group-item flush variant="primary" >Number of review written: {{user.reviewsWritten.length}}</b-list-group-item>
            <b-list-group-item flush variant="primary" class="d-flex"><span class="me-5">Alcoholic intake: {{ user.alcoholConsumed.length }}</span><b-button size="sm" class="ml-auto" @click="openAddEntryPopup">Add alcoholic entry</b-button></b-list-group-item>
            <b-list-group-item flush variant="primary">How many drinks tried: {{user.triedDrinks.length}}</b-list-group-item>
            <b-list-group-item flush variant="primary" class="d-flex" v-for="followedUser in userFollowingList" :key="followedUser.email">{{ user.userName }} follows: {{ followedUser.userName }}</b-list-group-item>
            <b-list-group-item flush variant="primary" v-if="this.favoriteSystembolag">Favorite systembolag: {{ this.favoriteSystembolag }}</b-list-group-item>
          </b-list-group>
        </b-card>
        <b-list-group>
        <h2 style="text-align: left">Reviews</h2>
        <b-card v-for="review in reviewsByUser" :key="review._id" style="max-width: 600px">
          <b-row>
          <b-col>
            <b-img :src="review.image" fluid alt="bottle image"  style="max-width: 300px; max-height: 300px; display:block;" @error="drinkPictureError"></b-img>
          </b-col>
          <b-col>
            <b-list-group style="max-width: 300px">
              <b-list-group-item flush variant="primary">Name: {{ review.drink }}</b-list-group-item>
              <b-list-group-item flush variant="primary">Rating: {{ review.rating }}</b-list-group-item>
              <b-list-group-item flush variant="primary">Review: {{ review.comment }}</b-list-group-item>
            </b-list-group>
          </b-col>
          </b-row>
        </b-card>
      </b-list-group>
      <!-- Add alcohol entry popup   -->
      <b-button block v-if="id === currentUserId" type="button" variant="login" @click="goToEdit()">Edit Profile</b-button>
        <b-modal v-model="addEntryPopup" title="Add alcoholic entry" hide-footer>
          <b-form @submit.prevent="submitAlcoholEntry">
            <b-form-group label="Volume (ml)">
              <b-form-input v-model.number="alcVolume" type="number" min="0" required />
            </b-form-group>
            <b-form-group label="Alcohol % (0–100)">
              <b-form-input v-model.number="alcPercent" type="number" min="0" max="100" required />
            </b-form-group>
            <b-button type="submit" variant="primary" class="mr-2">Save</b-button>
            <b-button variant="secondary" @click="addEntryPopup = false">Cancel</b-button>
          </b-form>
        </b-modal>
    </div>
  </div>
</template>

<script>
import { drinkApi } from '@/Api'

export default {
  name: 'users',
  data() {
    return {
      user: null,
      userFollowingList: [],
      reviewsByUser: [],
      currentUserId: null,
      favoriteSystembolag: null,
      show: false,
      addEntryPopup: false,
      alcVolume: null,
      alcPercent: null
    }
  },
  props: {
    id: String
  },
  methods: {
    getUserInfo() {
      drinkApi.get('/users/' + this.id)
        .then(response => {
          this.user = response.data
          if (!this.user.profilePicture) {
            this.user.profilePicture = '/profilePictures/default_user.jpg'
          }
          this.getUserFollowingList()
          this.getAllUserReviews()
          this.getFavoriteSystembolag()
        })
        .catch(error => {
          this.message = error
        })
    },
    getUserFollowingList() {
      drinkApi.get(this.user._links.follows)
        .then(response => {
          this.userFollowingList = response.data.follows
        })
        .catch(error => {
          this.message = error
        })
    },
    getFavoriteSystembolag() {
      drinkApi.get(this.user._links.favoritesSystembolag)
        .then(response => {
          if (response.data.favoriteSystembolag) {
            const systembolag = response.data
            this.favoriteSystembolag = systembolag.favoriteSystembolag.name
          } else {
            this.favoriteSystembolag = 'No favorite'
          }
        })
        .catch(error => {
          this.message = error
        })
    },
    goToEdit() {
      this.$router.push({ path: '/users/' + this.currentUserId + '/edit' })
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
    },
    getAllUserReviews() {
      this.reviewsByUser = []
      drinkApi.get('/users/' + this.user._id + '/reviews')
        .then(response => {
          this.allReviews = response.data.reviewedBy

          this.allReviews.forEach(review => {
            if (review.userID === this.user._id) {
              drinkApi.get('/drinks/' + review.productID)
                .then(response => {
                  this.drink = response.data
                  this.reviewsByUser.push({
                    drink: this.drink.name,
                    image: this.drink.image,
                    comment: review.comment,
                    rating: review.rating
                  })
                })
            }
          })
        })
    },
    profilePictureError(event) {
      event.target.src = '/profilePictures/default_user.jpg'
    },
    drinkPictureError(event) {
      event.target.src = '/drinkPictures/default_drink.jpg'
    },
    openAddEntryPopup() {
      this.addEntryPopup = true
    },
    submitAlcoholEntry() {
      if (this.alcVolume <= 0 || this.alcPercent < 0 || this.alcPercent > 100) return
      drinkApi.post(`/users/${this.user._id}/alcoholConsumed`, {
        volume: this.alcVolume,
        percent: this.alcPercent
      })
        .then(res => {
          this.user.alcoholConsumed.push(res.data)
          this.addEntryPopup = false
        })
        .catch(err => {
          console.error('Failed to add alcohol entry', err)
        })
    }
  },
  mounted() {
    this.fetchCurrentUser()
    this.getUserInfo()
  }
}
</script>

<style>
  .list-group-item {
    text-align: left;
  }
  .profile-picture {
    max-width: 600px;
    max-height: 450px;
    margin-left: 0px;
    display:block;
  }
</style>
