/**
* Handler that will be called during the execution of a PostLogin flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {

  const ManagementClient = require('auth0').ManagementClient;

   const management = new ManagementClient({
      domain: 'sf-futuresengine-prod.us.auth0.com',
      clientId: event.secrets.clientId,
      clientSecret: event.secrets.clientSecret
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
          await management.deleteUser({id:shellUserId})
          // Set flag on our social user that we have already deleted their shell account
          api.user.setAppMetadata("has_cleaned_shell_accounts", true);
          api.idToken.setCustomClaim('exists_in_db', true)
        } catch(e) {
          throw new Error(`Could not delete user with ID ${shellUserId}`);
        }
      }
    } catch (e) {
        throw new Error(`Something went wrong when determining whether to delete shell user ${userEmail}`);
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