const emailContents =
  'text-align: center; font-family: Figtree, Helvetica, Arial, sans-serif; max-width: 600px; min-width: 340px; margin-left: auto; margin-right: auto;';
const logoBox = 'padding: 40px 0;';
const logo = 'height: 25px;';
const h1HeadingBox =
  'background: #f3f9ff; padding: 40px; text-align: center; font-size: 24px; line-height: 36px; font-weight: 500;margin: 0;';
const contentBox =
  'width: 76%; margin-left: auto; margin-right: auto; margin-top: 40px; font-size: 18px; line-height: 26px;';
const signoffText = 'font-size: 14px; line-height: 18px;';
const hr = 'background-color: #dbdde2; margin-top: 40px;';
const footerMsg = 'margin-top: 40px;';
export const ulink = 'color: #317BB5';

const applyEmailHTMLTemplate = (subject: string, content: string) =>
  `<html lang="en">
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500&display=swap" rel="stylesheet">
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
    </head>
    <body>
      <div style="${emailContents}">
        <div style="${logoBox}">
          <img
            style="${logo}"
            src="https://auth0-assets-axb.pages.dev/tekalo-logo.png"
            alt="Tekalo logo"
            height="25"
          />
        </div>
        <div style="email-body">
          <h1 style="${h1HeadingBox}">${subject}</h1>
          <div style="${contentBox}">
            ${content}
            <div style="${signoffText}">
              <p>Thanks,<br/>
              The Tekalo Team</p>
              <hr style="${hr}"/>
              <div style="${footerMsg}">
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
