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
            <b-list-group-item flush variant="primary">Number of review written: {{user.reviewsWritten.length}}</b-list-group-item>
            <b-list-group-item flush variant="primary">Alcoholic intake: {{user.alcoholConsumed.length}}</b-list-group-item>
            <b-list-group-item flush variant="primary">How many drinks tried: {{user.triedDrinks.length}}</b-list-group-item>
            <b-list-group-item flush variant="primary" v-for="followedUser in userFollowingList" :key="followedUser.email">{{ user.userName }} follows: {{ followedUser.userName }}</b-list-group-item>
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
      <b-button block v-if="id === currentUserId" type="button" variant="login" @click="goToEdit()">Edit Profile</b-button>
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
      show: false
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
