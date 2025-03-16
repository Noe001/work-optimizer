import api from './api';
import userService from './userService';
import taskService from './taskService';
import meetingService from './meetingService';
import workLifeBalanceService from './workLifeBalanceService';

export {
  api,
  userService,
  taskService,
  meetingService,
  workLifeBalanceService,
};

export default {
  api,
  user: userService,
  task: taskService,
  meeting: meetingService,
  workLifeBalance: workLifeBalanceService,
}; 
