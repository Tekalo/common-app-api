/**
* Handler that will be called during the execution of a PostLogin flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {

  const ManagementClient = require('auth0').ManagementClient;

  const management = new ManagementClient({
      domain: '',
      clientId: '',
      clientSecret: '',
  });

  // Social login, first time
  if (event.connection.name === 'google-oauth2' && event.stats && event.stats.logins_count === 1) { 
    let shellUserId;
    let userEmail;
    try {
      userEmail = event.user.email;
      const existingUsers = await management.getUsersByEmail(userEmail);
      // Be sure we found our shell user and they never set their own password
      existingUsers.forEach((user) => {
        if(
          user.identities && 
          user.identities.length === 1 &&
          user.identities[0].connection === 'Username-Password-Authentication' && 
          !event.user.last_password_reset
        ){
          shellUserId = user.user_id;
        }
      })
      try {
        await management.deleteUser({id:shellUserId})
      } catch(e) {
        throw new Error(`Could not delete user with ID ${shellUserId}`);
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