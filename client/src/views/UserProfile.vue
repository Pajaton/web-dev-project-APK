<template>
    <!-- User Profile HTML template -->
    <div>
        <p>List of all registrered users</p>
        {{id}}
    </div>
</template>

<script>
// User Profile view behavior
export default {
  name: 'users',
  props: {
    id: String
  }
}
</script>

<style>
    /* User Profile CSS styles */
</style>
