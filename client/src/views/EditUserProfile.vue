<template>
  <!-- Register HTML template -->
  <div>
    <p>Edit Profile</p>
    <BForm>
      <BFormFloatingLabel
        label="Email address"
        label-for="floatingEmail"
        class="my-2"
      >
      <BFormInput
        id="floatingEmail"
        v-model="email"
        type="email"
        placeholder="Email address"
      />
      </BFormFloatingLabel>
      <BFormFloatingLabel
        label="User Name"
        label-for="floatingUserName"
        class="my-2"
      >
      <BFormInput
        id="floatingName"
        v-model="userName"
        type="text"
        placeholder="UserName"
      />
      </BFormFloatingLabel>
      <BFormFloatingLabel
        label="Street"
        label-for="floatingStreet"
        class="my-2"
      >
      <BFormInput
        id="floatingStreet"
        v-model="street"
        type="text"
        placeholder="street"
      />
      </BFormFloatingLabel>
      <BFormFloatingLabel
        label="StreetNumber"
        label-for="floatingStreetNumber"
        class="my-2"
      >
      <BFormInput
        id="floatingStreetNumber"
        v-model="streetNumber"
        type="text"
        placeholder="streetNumber"
      />
      </BFormFloatingLabel>
      <BFormFloatingLabel
        label="postalCode"
        label-for="floatingpostalCode"
        class="my-2"
      >
      <BFormInput
        id="floatingpostalCode"
        v-model="postalCode"
        type="text"
        placeholder="postalCode"
      />
      </BFormFloatingLabel>
      <BFormFloatingLabel
        label="city"
        label-for="floatingcity"
        class="my-2"
      >
      <BFormInput
        id="floatingcity"
        v-model="city"
        type="text"
        placeholder="city"
      />
      </BFormFloatingLabel>
      <BFormFloatingLabel
        label="longitude"
        label-for="floatinglongitude"
        class="my-2"
      >
      <BFormInput
        id="floatinglongitude"
        v-model="longitude"
        type="text"
        placeholder="longitude"
      />
      </BFormFloatingLabel>
      <BFormFloatingLabel
        label="latitude"
        label-for="floatinglatitude"
        class="my-2"
      >
      <BFormInput
        id="floatinglatitude"
        v-model="latitude"
        type="text"
        placeholder="latitude"
      />
      </BFormFloatingLabel>
    </BForm>
    <b-button block variant="danger" @click="resetFields()">Reset</b-button>
    <b-button block @click="editUser()">Edit Profile</b-button>
  </div>
</template>

<script>
// Register view behavior

import { drinkApi } from '@/Api'

export default {
  name: 'Register',
  mounted() {
    this.resetFields()
  },
  data() {
    return {
      message: 'none',
      email: '',
      userName: '',
      street: '',
      streetNumber: '',
      postalCode: '',
      city: '',
      longitude: '',
      latitude: '',
      mockUserID: '693951b9ff9d517c50d72ff1',
      userInfo: []
    }
  },
  methods: {
    async editUser() {
      drinkApi.patch('/users/' + this.mockUserID, {
        email: this.email,
        profilePicture: this.profilePicture,
        userName: this.userName,
        street: this.street,
        streetNumber: this.streetNumber,
        postalCode: this.postalCode,
        city: this.city,
        longitude: this.longitude,
        latitude: this.latitude
      })
      console.log('User edited: ' + this.userName + ' ' + ' Email: ' + this.email)
    },
    async resetFields() {
      const response = await drinkApi.get('/users/' + this.mockUserID)
      this.userInfo = response.data
      this.email = this.userInfo.email
      this.profilePicture = this.userInfo.profilePicture
      this.userName = this.userInfo.userName
      this.street = this.userInfo.street
      this.streetNumber = this.userInfo.streetNumber
      this.postalCode = this.userInfo.postalCode
      this.city = this.userInfo.city
      this.longitude = this.userInfo.longitude
      this.latitude = this.userInfo.latitude
    }
  }
}
</script>

<style>
    /* EditUserProfile CSS styles */
</style>
