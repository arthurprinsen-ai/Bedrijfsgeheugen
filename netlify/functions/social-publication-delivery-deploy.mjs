import { runSocialPublicationDelivery } from './social-publication-delivery.mjs';

export default {
  async deploySucceeded(event) {
    if (event?.deploy?.context !== 'production') return;
    await runSocialPublicationDelivery();
  }
};
