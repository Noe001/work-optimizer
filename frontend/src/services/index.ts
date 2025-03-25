import api from './api';
import userService from './userService';
import taskService from './taskService';
import meetingService from './meetingService';
import attendanceService from './attendanceService';

export {
  api,
  userService,
  taskService,
  meetingService,
  attendanceService,
};

export default {
  api,
  user: userService,
  task: taskService,
  meeting: meetingService,
  attendance: attendanceService,
}; 
