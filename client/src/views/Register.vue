<template>
  <!-- Register HTML template -->
  <div>
    <p>Register</p>
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
        label="Profile Picture"
        label-for="floatingProfilePicture"
        class="my-2"
      >
        <BFormInput
          id="floatingprofilepicture"
          v-model="ProfilePicture"
          type="picture"
          placeholder="Profile Picture"
        />
        </BFormFloatingLabel>
                <BFormFloatingLabel
        label="User Name"
        label-for="floatingUserName"
        class="my-2"
      >
        <BFormInput
          id="floatingName"
          v-model="UserName"
          type="name"
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
          type="street"
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
          type="streetNumber"
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
          type="postalCode"
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
          type="city"
          placeholder="city"
        />
        </BFormFloatingLabel>
    </BForm>
    <b-button block variant="danger" @click="resetFields()">Reset</b-button>
    <b-button block @click="registerUser()">Register</b-button>

    </div>
</template>

<script>

// Register view behavior
export default {
  name: 'Register',
  data() {
    return {
      message: 'none',
      email: '',
      ProfilePicture: '',
      UserName: '',
      street: '',
      streetNumber: '',
      postalCode: '',
      city: ''
    }
  },
  methods: {
    resetFields() {
      this.email = ''
      this.ProfilePicture = ''
      this.UserName = ''
      this.street = ''
      this.streetNumber = ''
      this.postalCode = ''
      this.city = ''
    }
  }
}
</script>

<style>
    /* Find Systembolag CSS styles */
</style>
