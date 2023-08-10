/* eslint-disable class-methods-use-this */
import UploadService from '@App/services/UploadService.js';

// TODO: Fix this never-closing stream
class DummyUploadService extends UploadService {}

export default DummyUploadService;
