<!-- Form for changing username (block style) -->

<script>
import BlockForm from '@/components/common/BlockForm.vue';

export default {
  name: 'VerifyUserForm',
  mixins: [BlockForm],
  data() {
    return {
      url: '/api/users',
      method: 'PUT',
      hasBody: true,
      setUsername: true,
      fields: [
        {id: 'image', label: 'Image', value: 'For the purposes of demonstration just submit anything here and you will be verified'}
      ],
      title: 'Verify Yourself',
      callback: () => {
        const message = 'Successfully verified yourself!';
        this.$set(this.alerts, message, 'success');
        setTimeout(() => this.$delete(this.alerts, message), 3000);
      }
    };
  }
};
</script>
