const applyEmailTemplate = (subject: string, content: string) =>
  `<html lang="en">
    <head>
      <style>
        .email-contents {
          text-align: center;
          font-family: Helvetica, Arial, sans-serif;
        }
        .heading-box {
          background: #f3f9ff;
          font-weight: 500;
          padding: 50px;
          text-align: center;
          margin-left: 40px;
          margin-right: 40px;
        }
        .footer-msg {
          margin-top: 60px;
        }
        .signoff-text{
          font-weight: 400;
        }
        .logo {
          width: 105px;
          height: 25px;
        }
        .logo-box {
          padding: 16px 64px 16px 64px;
        }
        .content-box {
          width: 100%;
          margin-left: auto;
          margin-right: auto;
          min-width: 340px;
          max-width: 70%;
        }
      </style>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
    </head>
    <body>
      <div class="email-contents">
        <div class="logo-box">
          <img
            class="logo"
            src="https://auth0-assets-axb.pages.dev/tekalo-logo.png"
            alt=""
          />
        </div>
        <div class="email-body">
          <h1 class="heading-box">${subject}</h1>
          <div class="content-box">
            ${content}
            <div class="signoff-text">
              <p>Thanks,</p>
              <p>The Tekalo Team</p>
              <hr />
              <div class="footer-msg">
                <p>
                  If you're having issues with your account, please don't hesitate
                  to contact us by replying to this email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>`;

export default applyEmailTemplate;
