const applyEmailHTMLTemplate = (subject: string, content: string) =>
  `<html lang="en">
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500&display=swap" rel="stylesheet">
      <style>
        .email-contents {
          text-align: center;
          font-family: Figtree, Helvetica, Arial, sans-serif;
          max-width: 600px;
          min-width: 340px;
          margin-left: auto;
          margin-right: auto;
        }
        .logo-box {
          padding: 40px 0;
        }
        .logo {
          height: 25px;
        }
        .heading-box {
          background: #f3f9ff;
          padding: 40px;
          text-align: center;
        }
        h1 {
          font-size: 24px;
          line-height: 36px
          font-weight: 500;
          margin: 0;
        }
        .content-box {
          width: 76%;
          margin-left: auto;
          margin-right: auto;
          margin-top: 40px;
          font-size: 18px;
          line-height: 26px;
        }
        .signoff-text {
          font-size: 14px;
          line-height: 18px;
        }
        hr {
          background-color: #dbdde2;
          margin-top: 40px;
        }
        .footer-msg {
          margin-top: 40px;
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
            alt="Tekalo logo"
            height="25"
          />
        </div>
        <div class="email-body">
          <h1 class="heading-box">${subject}</h1>
          <div class="content-box">
            ${content}
            <div class="signoff-text">
              <p>Thanks,<br/>
              The Tekalo Team</p>
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

export default applyEmailHTMLTemplate;
