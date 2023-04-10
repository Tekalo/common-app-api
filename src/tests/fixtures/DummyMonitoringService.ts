/* eslint-disable class-methods-use-this */
import MonitoringService from '@App/services/MonitoringService.js';

class DummyMonitoringService extends MonitoringService {
  sentryInit() {
    // noop
  }

  addSentryErrorHandler() {
    // noop
  }
}

export default DummyMonitoringService;
