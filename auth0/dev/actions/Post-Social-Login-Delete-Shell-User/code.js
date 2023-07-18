/**
* Handler that will be called during the execution of a PostLogin flow.
* When an applicant registers with Tekalo for the first time, we create a shell Auth0 account for them so that
* they are able to set a password later on.
* If they come back to Tekalo, and try logging in with a social provider, we want to remove the shell account
* in lieu of their new, social account. This action will:
* 1. Delete their shell account
* 2. Update their auth0ID in the Tekalo DB with that of their new social logged-in account 
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {

  const axios = require('axios');

  const ManagementClient = require('auth0').ManagementClient;

   const management = new ManagementClient({
      domain: 'sf-capp-dev.us.auth0.com',
      clientId: event.secrets.managementApiClientId,
      clientSecret: event.secrets.managementApiClientSecret
  });
  // Social login, first time for user who has never had their shell account cleaned
  if ((event.connection.name === 'google-oauth2' || event.connection.name === 'linkedin') &&
      (!event.user.app_metadata || !event.user.app_metadata.has_cleaned_shell_accounts)
  ) {
    let shellUserId;
    let userEmail;
    try {
      userEmail = event.user.email;
      const existingUsers = await management.getUsersByEmail(userEmail);
      for (let i = 0; i < existingUsers.length; i++) {
        const user = existingUsers[i];
        // Find our shell user
        if(
          user.identities && 
          user.identities.length === 1 &&
          user.identities[0].connection === 'Username-Password-Authentication' &&
          !user.last_password_reset // real shell accounts should never have set a password
        ){
          shellUserId = user.user_id;
          break;
        }
      }
      if (shellUserId){
        try {
          // Delete the shell user that Tekalo created upon initial registration
          await management.deleteUser({id:shellUserId})
          // Set flag on our social user that we have already deleted their shell account
          api.user.setAppMetadata("has_cleaned_shell_accounts", true);
          api.idToken.setCustomClaim('auth0.capp.com/exists_in_db', true)
        } catch(e) {
          throw new Error(`Could not delete user with ID ${shellUserId}`);
        }
      if (event.client.client_id === 'bk8hnOe5NfVA8xsVFy69iYJ1XEn42DTi') {
        try {
          // Check our Action cache for an existing accessToken
          let accessToken = api.cache.get('accessToken')?.value;
          if (accessToken === undefined) {
          // Get token from Auth0 to authenticate with Tekalo API
          const { data: tokenData } = await axios.post('https://capp-auth.dev.apps.futurestech.cloud/oauth/token', {
              client_id: event.secrets.tekaloActionManagementClientId,
              client_secret: event.secrets.tekaloActionManagementClientSecret,
              audience: "auth0.capp.com",
              grant_type: "client_credentials"
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
          });
          // Store accessToken in cache for the next X hours
          const expiration = tokenData.expires_in * 1000; // accesstoken expiration in ms
          api.cache.set('accessToken', tokenData.access_token, {expires_at: expiration - 60000});
          accessToken = tokenData.access_token;
        }
        // Call Tekalo API to update Auth0Id of user in Tekalo DB from shell Auth0Id to new socially logged-in Auth0Id
          const { status } = await axios.put(`https://capp-api.dev.apps.futurestech.cloud/applicants/${shellUserId}`, {
            auth0Id: event.user.user_id // Auth0Id of new, socially logged-in user
          }, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
          });
          if (status !== 200) {
            throw new Error(`Failed to login user ${event.user.email} via social login`);
          }
        } catch (e){
          throw new Error(`Failed to login user ${event.user.email} via social login`);
        }
       }
      }
    } catch (e) {
      throw new Error(`Failed to login user ${event.user.email} via social login`);
    }
  }
};


/**
* Handler that will be invoked when this action is resuming after an external redirect. If your
* onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
// exports.onContinuePostLogin = async (event, api) => {
// };