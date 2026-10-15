// Historical deploy hook retired: do not execute a second social sender.
// Production delivery is exclusively managed by the existing Supabase publisher.
export default {
  async deploySucceeded() {
    return {ok:true,legacy_sender:'RETIRED',provider_write_performed:false};
  },
};
export const config={region:'fra'};
