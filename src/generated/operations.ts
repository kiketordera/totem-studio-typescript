/** Generated from openapi.json. Do not edit. */
export const CONTRACT_SHA256 = '6661d51725b759bc5efb31cd6318dad1d295b598f4d819bfec748c2614ec1bd8'
export const DEFAULT_BASE_URL = 'https://api.totemstudio.ai/v1'
export const operationDefinitions = {
  "me.get": {
    "method": "GET",
    "path": "/me",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "teams.list": {
    "method": "GET",
    "path": "/teams",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "teams.get": {
    "method": "GET",
    "path": "/teams/{id}",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "boards.list": {
    "method": "GET",
    "path": "/boards",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": [
      "limit",
      "cursor"
    ]
  },
  "members.list": {
    "method": "GET",
    "path": "/members",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": []
  },
  "booking_services.list": {
    "method": "GET",
    "path": "/booking_services",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": []
  },
  "leads.list": {
    "method": "GET",
    "path": "/leads",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": [
      "limit",
      "cursor",
      "board",
      "stage",
      "status"
    ]
  },
  "leads.get": {
    "method": "GET",
    "path": "/leads/{id}",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "leads.search": {
    "method": "POST",
    "path": "/leads/search",
    "authenticated": true,
    "body": true,
    "team": true,
    "query": []
  },
  "leads.activities": {
    "method": "GET",
    "path": "/leads/{id}/activities",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": [
      "limit",
      "cursor"
    ]
  },
  "calls.list": {
    "method": "GET",
    "path": "/calls",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": [
      "limit",
      "cursor"
    ]
  },
  "calls.get": {
    "method": "GET",
    "path": "/calls/{id}",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "conversations.list": {
    "method": "GET",
    "path": "/conversations",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": [
      "limit",
      "cursor"
    ]
  },
  "conversations.get": {
    "method": "GET",
    "path": "/conversations/{id}",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "bookings.list": {
    "method": "GET",
    "path": "/bookings",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": [
      "limit",
      "cursor"
    ]
  },
  "bookings.get": {
    "method": "GET",
    "path": "/bookings/{id}",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "sync.changes": {
    "method": "GET",
    "path": "/sync/changes",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": [
      "cursor",
      "limit"
    ]
  },
  "health": {
    "method": "GET",
    "path": "/health",
    "authenticated": false,
    "body": false,
    "team": false,
    "query": []
  }
} as const
