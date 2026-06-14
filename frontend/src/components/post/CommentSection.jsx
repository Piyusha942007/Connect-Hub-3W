import React, { useState, memo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { commentPostApi, replyCommentPostApi } from '../../services/apiService';
import { formatRelativeTime, getGradientForUsername, isVerifiedUser } from '../../utils/helpers';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import SendIcon from '@mui/icons-material/Send';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import VerifiedIcon from '@mui/icons-material/Verified';

const CommentSection = ({ postId, comments, onCommentAdded, onReplyAdded, showSnackbar, commentInputRef }) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // States for comment replies
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visibleComments = showAll ? comments : (comments ? comments.slice(-2) : []);

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    const textToSend = commentText.trim();
    setCommentText(''); // Clear input instantly for snappy feel
    setSubmitting(true);

    try {
      // Optimistic comment creation locally
      const tempComment = {
        _id: `temp-${Date.now()}`,
        userId: user._id,
        username: user.username,
        text: textToSend,
        createdAt: new Date().toISOString(),
        replies: [],
      };
      
      // Perform optimistic add
      const rollback = onCommentAdded(postId, tempComment, true);

      try {
        const updatedComments = await commentPostApi(postId, textToSend);
        // Commit actual response from DB
        onCommentAdded(postId, updatedComments, false);
      } catch (apiError) {
        // Rollback on connection/API failure
        rollback();
        showSnackbar(apiError.message || 'Failed to submit comment. Please retry.', 'error');
        setCommentText(textToSend); // Restore text in case of failure
      }
    } catch (err) {
      showSnackbar(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleReplyForm = useCallback((commentId) => {
    if (!user) {
      showSnackbar('You must be logged in to reply to comments.', 'warning');
      return;
    }
    setReplyingToCommentId((prevId) => {
      if (prevId === commentId) {
        setReplyText('');
        return null;
      } else {
        setReplyText('');
        return commentId;
      }
    });
  }, [user, showSnackbar]);

  const handleSubmitReply = async (e, commentId) => {
    e.preventDefault();

    if (!user) {
      showSnackbar('You must be logged in to reply to comments.', 'warning');
      return;
    }
    if (!replyText.trim()) return;

    const textToSend = replyText.trim();
    setReplyText(''); // Clear input instantly
    setReplyingToCommentId(null); // Close input panel
    setReplySubmitting(true);

    try {
      // Create optimistic reply subdocument
      const tempReply = {
        _id: `temp-reply-${Date.now()}`,
        userId: user._id,
        username: user.username,
        text: textToSend,
        createdAt: new Date().toISOString(),
      };

      // Trigger optimistic add
      const rollback = onReplyAdded(postId, commentId, tempReply, true);

      try {
        const updatedComments = await replyCommentPostApi(postId, commentId, textToSend);
        // Commit database actual comments list (containing nested replies)
        onReplyAdded(postId, commentId, updatedComments, false);
      } catch (apiError) {
        rollback(); // revert on failure
        showSnackbar(apiError.message || 'Failed to post reply. Please retry.', 'error');
        setReplyText(textToSend); // restore input
        setReplyingToCommentId(commentId); // reopen panel
      }
    } catch (err) {
      showSnackbar(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <Box sx={{ mt: 1, pt: 1 }}>
      <Divider sx={{ mb: 2, borderColor: 'rgba(0,0,0,0.04)' }} />

      {/* Input Field for New Comment */}
      {user ? (
        <Box component="form" onSubmit={handleSubmitComment} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              background: getGradientForUsername(user?.username),
              fontWeight: 700,
              width: 32,
              height: 32,
              fontSize: '0.85rem',
            }}
          >
            {user?.username ? user.username[0].toUpperCase() : 'U'}
          </Avatar>
          <TextField
            inputRef={commentInputRef}
            placeholder="Write a comment..."
            size="small"
            fullWidth
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={submitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment(e);
              }
            }}
            sx={{
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#fafbfc',
              },
            }}
            slotProps={{
              input: {
                style: { fontSize: '0.9rem' },
              },
            }}
            aria-label="Comment text"
          />
          <IconButton
            color="primary"
            type="submit"
            disabled={!commentText.trim() || submitting}
            aria-label="Send comment"
          >
            {submitting ? <CircularProgress size={20} /> : <SendIcon sx={{ fontSize: 20 }} />}
          </IconButton>
        </Box>
      ) : (
        <Box
          sx={{
            p: 2,
            mb: 2.5,
            textAlign: 'center',
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc',
            borderRadius: '10px',
            border: (theme) => theme.palette.mode === 'dark' ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            You must be{' '}
            <span
              style={{ fontWeight: 700, cursor: 'pointer', color: '#1976d2', textDecoration: 'underline' }}
              onClick={() => window.location.href = '/login'}
            >
              logged in
            </span>{' '}
            to comment on this post.
          </Typography>
        </Box>
      )}

      {/* Comments List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!showAll && comments && comments.length > 2 && (
          <Button
            variant="text"
            size="small"
            onClick={() => setShowAll(true)}
            sx={{
              alignSelf: 'flex-start',
              fontWeight: 700,
              color: 'primary.main',
              mb: 0.5,
              fontSize: '0.78rem',
              textTransform: 'none',
              pl: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
              },
            }}
          >
            View all {comments.reduce((acc, c) => acc + 1 + (c.replies ? c.replies.length : 0), 0)} comments
          </Button>
        )}
        {showAll && comments && comments.length > 2 && (
          <Button
            variant="text"
            size="small"
            onClick={() => setShowAll(false)}
            sx={{
              alignSelf: 'flex-start',
              fontWeight: 700,
              color: 'text.secondary',
              mb: 0.5,
              fontSize: '0.78rem',
              textTransform: 'none',
              pl: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Collapse comments
          </Button>
        )}
        {visibleComments && visibleComments.length > 0 ? (
          visibleComments.map((comment) => (
            <Box key={comment._id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {/* Parent Comment Row */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Avatar
                  sx={{
                    background: getGradientForUsername(comment.username),
                    fontWeight: 600,
                    width: 28,
                    height: 28,
                    fontSize: '0.75rem',
                  }}
                >
                  {comment.username ? comment.username[0].toUpperCase() : 'C'}
                </Avatar>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexGrow: 1 }}>
                  {/* Comment Bubble */}
                  <Box
                    sx={{
                      backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : '#f0f2f5',
                      borderRadius: '12px',
                      p: '8px 12px',
                      maxWidth: '90%',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'text.primary', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {comment.username}
                      {isVerifiedUser(comment.username) && (
                        <VerifiedIcon sx={{ fontSize: 14, color: '#1d9bf0' }} />
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.primary', whiteSpace: 'pre-wrap' }}>
                      {comment.text}
                    </Typography>
                  </Box>

                  {/* Actions Row */}
                  <Box sx={{ display: 'flex', gap: 2, ml: 1, mt: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: replyingToCommentId === comment._id ? 'primary.main' : 'text.secondary',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        '&:hover': { color: 'primary.main' },
                      }}
                      onClick={() => handleToggleReplyForm(comment._id)}
                    >
                      Reply
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {formatRelativeTime(comment.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Indented Replies List */}
              {comment.replies && comment.replies.map((reply) => (
                <Box key={reply._id} sx={{ display: 'flex', gap: { xs: 1, sm: 1.2 }, pl: { xs: 3, sm: 5.5 }, mt: 0.8, alignItems: 'flex-start' }}>
                  <Avatar
                    sx={{
                      width: 22,
                      height: 22,
                      fontSize: '0.6rem',
                      background: getGradientForUsername(reply.username),
                      fontWeight: 'bold',
                    }}
                  >
                    {reply.username ? reply.username[0].toUpperCase() : 'R'}
                  </Avatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexGrow: 1 }}>
                    <Box
                      sx={{
                        backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f8f9fa',
                        borderRadius: '12px',
                        p: '8px 12px',
                        border: '1px solid rgba(0,0,0,0.03)',
                        maxWidth: '90%',
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.primary', mb: 0.2, display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        {reply.username}
                        {isVerifiedUser(reply.username) && (
                          <VerifiedIcon sx={{ fontSize: 12, color: '#1d9bf0' }} />
                        )}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.primary', whiteSpace: 'pre-wrap' }}>
                        {reply.text}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', ml: 1, mt: 0.3 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {formatRelativeTime(reply.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}

              {/* Indented Reply Form Panel */}
              {replyingToCommentId === comment._id && (
                <Box
                  component="form"
                  onSubmit={(e) => handleSubmitReply(e, comment._id)}
                  sx={{ display: 'flex', gap: { xs: 1, sm: 1.2 }, pl: { xs: 3, sm: 5.5 }, mt: 1, alignItems: 'center' }}
                >
                  <Avatar
                    sx={{
                      width: 22,
                      height: 22,
                      fontSize: '0.6rem',
                      background: getGradientForUsername(user?.username),
                      fontWeight: 'bold',
                    }}
                  >
                    {user?.username ? user.username[0].toUpperCase() : 'U'}
                  </Avatar>
                  <TextField
                    placeholder={`Reply to ${comment.username}...`}
                    size="small"
                    fullWidth
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={replySubmitting}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitReply(e, comment._id);
                      }
                    }}
                    sx={{
                      flexGrow: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#fafbfc',
                        padding: '2px 8px',
                      },
                    }}
                    slotProps={{
                      input: {
                        style: { fontSize: '0.8rem' },
                      },
                    }}
                    autoFocus
                  />
                  <IconButton
                    color="primary"
                    type="submit"
                    disabled={!replyText.trim() || replySubmitting}
                    size="small"
                    aria-label="Send reply"
                  >
                    {replySubmitting ? <CircularProgress size={16} /> : <SendIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Box>
              )}
            </Box>
          ))
        ) : (
          <Box sx={{ py: 1, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              No comments yet. Start the conversation.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Memoize the CommentSection to prevent unnecessary re-renders when other posts update
export default memo(CommentSection);
