import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  var API_BASE_URL = 'http://localhost:5000';

  async function fetchNotifications() {
    try {
      setLoading(true);
      var res = await axios.get(API_BASE_URL + '/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(function() {
    fetchNotifications();
    // Poll every 30 seconds
    var interval = setInterval(fetchNotifications, 30000);
    return function() {
      clearInterval(interval);
    };
  }, []);

  async function markAsRead(id) {
    try {
      await axios.post(API_BASE_URL + '/api/notifications/' + id + '/read');
      setNotifications(function(prev) {
        return prev.map(function(n) {
          if (n._id === id) {
            return Object.assign({}, n, { read: true });
          }
          return n;
        });
      });
    } catch (err) {
      console.error('Mark read error:', err);
    }
  }

  async function markAllAsRead() {
    try {
      await axios.post(API_BASE_URL + '/api/notifications/read-all');
      setNotifications(function(prev) {
        return prev.map(function(n) {
          return Object.assign({}, n, { read: true });
        });
      });
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  }

  async function clearReadNotifications() {
    try {
      await axios.delete(API_BASE_URL + '/api/notifications/clear/read');
      setNotifications(function(prev) {
        return prev.filter(function(n) {
          return !n.read;
        });
      });
    } catch (err) {
      console.error('Clear notifications error:', err);
    }
  }

  function toggleDropdown() {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchNotifications();
    }
  }

  var unreadCount = notifications.filter(function(n) {
    return !n.read;
  }).length;

  return React.createElement('div', { className: 'notifications-container' },
    React.createElement('button', { 
      className: 'notification-bell', 
      onClick: toggleDropdown 
    },
      '🔔',
      unreadCount > 0 && React.createElement('span', { className: 'badge' }, unreadCount)
    ),

    showDropdown && React.createElement('div', { className: 'notification-dropdown' },
      React.createElement('div', { className: 'notification-header' },
        React.createElement('h4', null, 'Notifications'),
        React.createElement('div', { className: 'notification-actions' },
          unreadCount > 0 && React.createElement('button', {
            onClick: markAllAsRead,
            className: 'mark-all-btn'
          }, 'Mark all read'),
          notifications.some(function(n) { return n.read; }) && React.createElement('button', {
            onClick: clearReadNotifications,
            className: 'clear-btn'
          }, 'Clear read')
        )
      ),

      loading
        ? React.createElement('p', { className: 'loading-text' }, 'Loading...')
        : notifications.length === 0
          ? React.createElement('p', { className: 'no-notifications' }, 'No notifications')
          : React.createElement('div', { className: 'notification-list' },
              notifications.slice(0, 20).map(function(n) {
                return React.createElement('div', {
                  key: n._id,
                  className: 'notification-item ' + (n.read ? 'read' : 'unread'),
                  onClick: function() { if (!n.read) markAsRead(n._id); }
                },
                  React.createElement('div', { className: 'notification-content' },
                    React.createElement('strong', null, n.title),
                    React.createElement('p', null, n.message),
                    React.createElement('small', null, new Date(n.createdAt).toLocaleString())
                  ),
                  !n.read && React.createElement('span', { className: 'unread-dot' })
                );
              })
            )
    )
  );
}

export default Notifications;