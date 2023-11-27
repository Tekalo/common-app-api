/* eslint-disable class-methods-use-this */
import SQSService from '@App/services/SQSService.js';

class DummySQSService extends SQSService {
  async sendEmail() {
    return Promise.resolve({ $metadata: {}, MessageId: '' });
  }
}

export default DummySQSService;
