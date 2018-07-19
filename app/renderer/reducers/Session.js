import { omit } from 'lodash';
import formatJSON from 'format-json';

import {
  NEW_SESSION_REQUESTED, NEW_SESSION_BEGAN, NEW_SESSION_DONE,
  SAVE_SESSION_REQUESTED, SAVE_SESSION_DONE, GET_SAVED_SESSIONS_REQUESTED,
  GET_SAVED_SESSIONS_DONE, SESSION_LOADING, SESSION_LOADING_DONE,
  SET_CAPABILITY_PARAM, ADD_CAPABILITY, REMOVE_CAPABILITY, SET_CAPS,
  SWITCHED_TABS, SAVE_AS_MODAL_REQUESTED, HIDE_SAVE_AS_MODAL_REQUESTED,
  SET_SAVE_AS_TEXT, DELETE_SAVED_SESSION_REQUESTED, DELETE_SAVED_SESSION_DONE,
  CHANGE_SERVER_TYPE, SET_SERVER_PARAM, SET_SERVER, SET_ATTACH_SESS_ID,
  GET_SESSIONS_REQUESTED, GET_SESSIONS_DONE, ENABLE_DESIRED_CAPS_EDITOR,
  ABORT_DESIRED_CAPS_EDITOR, SAVE_RAW_DESIRED_CAPS, SET_RAW_DESIRED_CAPS,
  SHOW_DESIRED_CAPS_JSON_ERROR, CHANGE_SESSION_MODE, CHANGE_TEST,
  DELETE_SAVED_TEST_REQUESTED, DELETE_SAVED_TEST_DONE, SHOW_CAPS_MODAL,
  HIDE_CAPS_MODAL, TEST_RUNNING, HIDE_TESTRUN_MODAL, TEST_COMPLETE,
  TEST_ACTION_UPDATED, TEST_RUN_REQUESTED, SET_TEST_RESULTS, SHOW_RESULT,
  TEST_SELECTED, ServerTypes, SessionModes
} from '../actions/Session';

import { SET_SAVED_TESTS } from '../actions/Inspector';

// Make sure there's always at least one cap
const INITIAL_STATE = {
  mode: SessionModes.inspect,
  savedSessions: [],
  tabKey: 'new',
  serverType: ServerTypes.local,
  server: {
    local: {},
    remote: {},
    sauce: {},
    testobject: {
      dataCenter: 'US',
    },
    headspin: {},
    browserstack: {},
    advanced: {},
  },
  attachSessId: null,

  // Make sure there's always at least one cap
  caps: [{
    type: 'text',
  }],

  isCapsDirty: true,
  gettingSessions: false,
  runningAppiumSessions: [],
  isEditingDesiredCaps: false,
  isValidCapsJson: true,
  isValidatingCapsJson: false,

  // playback stuff
  savedTests: [],
  testResults: [],
  deletingTest: null,
  capsModal: null,
  testToRun: null,
  testInProgress: null,
  testResultToShow: null,
  isTestRunning: false,
  actionsStatus: [],
};

let nextState;

export default function session (state = INITIAL_STATE, action) {
  switch (action.type) {
    case NEW_SESSION_REQUESTED:
      return {
        ...state,
        newSessionRequested: true,
      };

    case NEW_SESSION_BEGAN:
      nextState = {
        ...state,
        newSessionBegan: true,
      };
      return omit(nextState, 'newSessionRequested');

    case NEW_SESSION_DONE:
      return omit(state, 'newSessionBegan');


    case ADD_CAPABILITY:
      return {
        ...state,
        caps: [
          ...state.caps,
          {type: 'text'},
        ],
      };

    case REMOVE_CAPABILITY:
      return {
        ...state,
        caps: state.caps.filter((cap, index) => index !== action.index),
      };

    case SET_CAPABILITY_PARAM:
      return {
        ...state,
        isCapsDirty: true,
        caps: state.caps.map((cap, index) => index !== action.index ? cap : {
          ...cap,
          [action.name]: action.value
        }),
      };

    case SET_CAPS:
      nextState = {
        ...state,
        caps: action.caps,
        capsUUID: action.uuid,
      };
      return omit(nextState, 'isCapsDirty');

    case SAVE_SESSION_REQUESTED:
      nextState = {
        ...state,
        saveSessionRequested: true,
      };
      return omit(nextState, 'showSaveAsModal');

    case SAVE_SESSION_DONE:
      return omit(state, ['saveSessionRequested', 'saveAsText']);

    case GET_SAVED_SESSIONS_REQUESTED:
      return {
        ...state,
        getSavedSessionsRequested: true,
      };

    case GET_SAVED_SESSIONS_DONE:
      nextState = {
        ...state,
        savedSessions: action.savedSessions || [],
      };
      return omit(nextState, 'getSavedSessionsRequested');

    case DELETE_SAVED_SESSION_REQUESTED:
      return {
        ...state,
        deletingSession: true,
      };

    case DELETE_SAVED_SESSION_DONE:
      return {
        ...state,
        deletingSession: false,
        capsUUID: null
      };

    case SWITCHED_TABS:
      return {
        ...state,
        tabKey: action.key,
      };

    case SAVE_AS_MODAL_REQUESTED:
      return {
        ...state,
        showSaveAsModal: true,
      };

    case HIDE_SAVE_AS_MODAL_REQUESTED:
      return omit(state, ['saveAsText', 'showSaveAsModal']);

    case SET_SAVE_AS_TEXT:
      return {
        ...state,
        saveAsText: action.saveAsText,
      };

    case CHANGE_SERVER_TYPE:
      return {
        ...state,
        serverType: action.serverType,
      };

    case SET_SERVER_PARAM:
      return {
        ...state,
        server: {
          ...state.server,
          [action.serverType]: {
            ...state.server[action.serverType],
            [action.name]: action.value,
          }
        },
      };

    case SET_SERVER:
      return {
        ...state,
        // Only set remote, sauce, headspin, and testobject;
        // 'local' comes from electron-settings
        server: {
          ...state.server,
          remote: action.server.remote || {},
          sauce: action.server.sauce || {},
          testobject: action.server.testobject || {},
          headspin: action.server.headspin || {},
          browserstack: action.server.browserstack || {},
        },
        serverType: action.serverType || ServerTypes.local,
      };

    case SET_ATTACH_SESS_ID:
      return {
        ...state,
        attachSessId: action.attachSessId
      };

    case SESSION_LOADING:
      return {
        ...state,
        sessionLoading: true,
      };

    case SESSION_LOADING_DONE:
      return omit(state, 'sessionLoading');

    case GET_SESSIONS_REQUESTED:
      return {
        ...state,
        gettingSessions: true,
      };

    case GET_SESSIONS_DONE:
      return {
        ...state,
        gettingSessions: false,
        attachSessId: (action.sessions && action.sessions.length > 0 && !state.attachSessId) ? action.sessions[0].id : state.attachSessId,
        runningAppiumSessions: action.sessions || [],
      };

    case ENABLE_DESIRED_CAPS_EDITOR: // eslint-disable-line no-case-declarations
      const {caps} = state;
      let rawCaps = {};
      for (let {name, value} of caps) {
        rawCaps[name] = value;
      }

      return {
        ...state,
        isEditingDesiredCaps: true,
        rawDesiredCaps: formatJSON.plain(rawCaps),
        isValidCapsJson: true,
        isValidatingCapsJson: false, // Don't start validating JSON until the user has attempted to save the JSON
      };

    case ABORT_DESIRED_CAPS_EDITOR:
      return {
        ...state,
        isEditingDesiredCaps: false,
        rawDesiredCaps: null,
      };

    case SAVE_RAW_DESIRED_CAPS:
      return {
        ...state,
        isEditingDesiredCaps: false,
        caps: action.caps,
      };

    case SHOW_DESIRED_CAPS_JSON_ERROR:
      return {
        ...state,
        invalidCapsJsonReason: action.message,
        isValidCapsJson: false,
        isValidatingCapsJson: true,
      };

    case SET_RAW_DESIRED_CAPS:
      return {
        ...state,
        rawDesiredCaps: action.rawDesiredCaps,
        isValidCapsJson: action.isValidCapsJson,
        invalidCapsJsonReason: action.invalidCapsJsonReason,
      };

    case CHANGE_SESSION_MODE:
      return {
        ...state,
        mode: action.mode,
      };

    case SET_SAVED_TESTS:
      return {...state, savedTests: action.tests};

    case CHANGE_TEST:
      break;
    case DELETE_SAVED_TEST_REQUESTED:
      return {...state, deletingTest: action.id};

    case DELETE_SAVED_TEST_DONE:
      return {...state, deletingTest: null};

    case SHOW_CAPS_MODAL:
      return {...state, capsModal: action.id};

    case HIDE_CAPS_MODAL:
      return {...state, capsModal: null};

    case TEST_ACTION_UPDATED:
      return {...state, actionsStatus: action.actions};

    case TEST_SELECTED:
      return {...state, testToRun: action.id};

    case TEST_RUN_REQUESTED:
      return {...state, testInProgress: state.testToRun, actionsStatus: []};

    case TEST_RUNNING:
      return {...state, isTestRunning: true};

    case TEST_COMPLETE:
      return {...state, isTestRunning: false};

    case HIDE_TESTRUN_MODAL:
      return {...state, testResultToShow: null, testInProgress: null, actionsStatus: []};

    case SET_TEST_RESULTS:
      return {...state, testResults: action.results};

    case SHOW_RESULT:
      return {...state, testResultToShow: action.id};

    default:
      return {...state};
  }
}
