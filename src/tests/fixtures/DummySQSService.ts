/* eslint-disable class-methods-use-this */
import SQSService from '@App/services/SQSService.js';

class DummySQSService extends SQSService {
  async enqueueMessage() {
    return Promise.resolve({ $metadata: {}, MessageId: '' });
  }
}

export default DummySQSService;
