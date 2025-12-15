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
/>
</BFormFloatingLabel>
</BForm>
<b-row>
  <b-col cols="4">
<b-img class="images" :src="profilePicture" style="float:left" thumbnail alt="Profile Picture"></b-img>
<b-button @click="modalShow = !modalShow">Choose profile picture</b-button>
<b-modal v-model="modalShow" title="Choose profile picture">
  <b-img class="images" v-for="(picture, index) in profilePictureList"
  :key="index" :src="picture" thumbnail fluid @click="setProfilePicture(picture)">
</b-img>
</b-modal>
</b-col>
<b-col cols="12">
<b-button block variant="danger" @click="resetFields()">Reset</b-button>
<b-button block @click="editUser()">Edit Profile</b-button>
</b-col>
</b-row>
</div>
</template>

<script>
// Register view behavior

import { drinkApi } from '@/Api'

export default {
  name: 'Register',
  mounted() {
    this.fetchCurrentUser()
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
      currentUserId: null,
      userInfo: [],
      profilePicture: '',
      modalShow: false,
      profilePictureList: [
        '/profilePictures/greger.jpg',
        '/profilePictures/bacchus.jpg',
        '/profilePictures/dionysos.jpg',
        '/profilePictures/freya.jpg',
        '/profilePictures/ellie.jpg',
        '/profilePictures/jules.jpg',
        '/profilePictures/tyrion.jpg',
        '/profilePictures/penny.jpg',
        '/profilePictures/zoro.jpg',
        '/profilePictures/kapten_haddock.jpeg',
        '/profilePictures/malory_archer.jpg',
        '/profilePictures/sterling_archer.jpg',
        '/profilePictures/pam.jpg',
        '/profilePictures/patsy.jpg',
        '/profilePictures/tom.png'
      ]
    }
  },
  methods: {
    async editUser() {
      drinkApi.patch('/users/' + this.currentUserId, {
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
      const response = await drinkApi.get('/users/' + this.currentUserId)
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
    },
    setProfilePicture(picture) {
      this.profilePicture = picture
    },
    fetchCurrentUser() {
      drinkApi.get('/sessions/currentlyLoggedin/')
        .then(response => {
          this.currentUserId = response.data.user._id
          return this.resetFields()
        })
        .catch(error => {
          this.message = error
        })
    }
  }
}
</script>

<style>
    /* EditUserProfile CSS styles */
    .images {
      max-width: 150px !important;
    }
    .my-2 {
      max-width: 500px;
    }
</style>
