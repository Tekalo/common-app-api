/* eslint-disable class-methods-use-this */
import SESService from '../../SESService.js';

class DummySESService extends SESService {
  async sendEmail() {
    return Promise.resolve({ $metadata: {}, MessageId: '' });
  }
}

export default DummySESService;
