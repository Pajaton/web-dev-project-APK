<template>
  <div>
    <div v-if="user">
      <ul class="user-info-list">
        <li>Username: {{user.userName}}</li>
        <li>Email: {{user.email}}</li>
        <li>Adress: {{user.street}} {{ user.streetNumber}}</li>
        <li>Postal code: {{user.postalCode}}</li>
        <li>City: {{user.city}}</li>
        <li>Following: {{user.follows.length}} people</li>
        <li>Number of review written: {{user.reviewsWritten.length}}</li>
        <li>Alcoholic intake: {{user.alcoholConsumed.length}}</li>
        <li>How many drinks tried: {{user.triedDrinks.length}}</li>
      </ul>
    </div>
  </div>
</template>

<script>

import { drinkApi } from '@/Api'

export default {
  name: 'users',
  data() {
    return {
      user: null
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
          console.log(this.user._links.following)
        })
        .catch(error => {
          this.message = error
        })
    },
    getUserFollowingList() {
      drinkApi.get(this.user._links.following)
        .then(response => {
          console.log('this method ran')
          this.user = response.data
        })
        .catch(error => {
          this.message = error
        })
    }
  },
  created() {
    this.user = this.getUserInfo()
  }
}
</script>

<style>
  .user-info-list {
    text-align: left;
}
</style>
