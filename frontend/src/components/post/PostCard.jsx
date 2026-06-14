import React, { useState, memo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { likePostApi, deletePostApi, promotePostApi, votePollApi } from '../../services/apiService';
import { formatRelativeTime, getGradientForUsername, isVerifiedUser } from '../../utils/helpers';
import CommentSection from './CommentSection';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import EditPostDialog from './EditPostDialog';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import VerifiedIcon from '@mui/icons-material/Verified';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { LikeIcon, CommentIcon, ShareIcon, PromoteIcon, TrendingIcon, CloseIcon, MoreIcon, ImageIcon } from '../common/CustomIcons';

const PostCard = ({ post, onLikeToggle, onCommentAdded, onReplyAdded, onPostUpdated, onPostDeleted, showSnackbar }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const mode = theme.palette.mode;
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // New enhancements states and refs
  const [textExpanded, setTextExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const commentInputRef = React.useRef(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const clickTimeoutRef = React.useRef(null);
  const [likeAnimated, setLikeAnimated] = useState(false);
  const imgRef = React.useRef(null);

  // Fix React cached image onLoad bug
  React.useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
    }
  }, [post.image]);

  // Poll properties and handler
  const userVotedOption = post.poll
    ? post.poll.options.find(opt => opt.votes.includes(user?._id))
    : null;
  const hasVoted = !!userVotedOption;
  const totalPollVotes = post.poll
    ? post.poll.options.reduce((acc, opt) => acc + opt.votes.length, 0)
    : 0;

  const getOptionPercentage = (votesCount) => {
    if (totalPollVotes === 0) return 0;
    return Math.round((votesCount / totalPollVotes) * 100);
  };

  const handleVote = async (optionId) => {
    if (!user) {
      showSnackbar('You must be logged in to vote in polls.', 'warning');
      return;
    }
    try {
      const updatedPost = await votePollApi(post._id, optionId);
      onPostUpdated(updatedPost);
      showSnackbar('Your vote has been registered!', 'success');
    } catch (err) {
      showSnackbar(err.message || 'Failed to submit vote.', 'error');
    }
  };

  const handleImageClick = (e) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      // It's a double click - handled by handleImageDoubleClick
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        setDetailModalOpen(true);
        clickTimeoutRef.current = null;
      }, 250);
    }
  };

  const handleImageDoubleClick = (e) => {
    e.stopPropagation();
    if (!user) {
      showSnackbar('You must be logged in to like posts.', 'warning');
      return;
    }
    
    // Only trigger like if not already liked (Instagram style)
    if (!isLikedByMe) {
      handleLikeClick();
    }
    
    setShowHeartPop(true);
    setTimeout(() => {
      setShowHeartPop(false);
    }, 800);
  };

  const handlePromoteConfirm = async () => {
    setPromoteDialogOpen(false);
    try {
      const updatedPost = await promotePostApi(post._id);
      onPostUpdated(updatedPost);
      showSnackbar(updatedPost.isPromoted ? 'Post boosted to featured promotions!' : 'Featured promotion removed.', 'success');
    } catch (err) {
      showSnackbar(err.message || 'Failed to update promotion status.', 'error');
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    handleMenuClose();
    setEditDialogOpen(true);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteConfirmOpen(false);
    try {
      await deletePostApi(post._id);
      showSnackbar('Post deleted successfully!', 'success');
      onPostDeleted(post._id);
    } catch (err) {
      showSnackbar(err.message || 'Failed to delete post.', 'error');
    }
  };

  // Check if current user liked the post
  const isLikedByMe = post.likes.some((like) => like.userId === user?._id);

  // Dynamic image url computation
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    return `${apiUrl}${imagePath}`;
  };

  const handleLikeClick = async () => {
    if (!user) {
      showSnackbar('You must be logged in to like posts.', 'warning');
      return;
    }

    setLikeAnimated(true);
    setTimeout(() => setLikeAnimated(false), 200);

    // Trigger optimistic update locally
    const rollback = onLikeToggle(post._id, user._id, user.username, true);

    try {
      const updatedLikes = await likePostApi(post._id);
      // Commit the database returned likes
      onLikeToggle(post._id, updatedLikes, false);
    } catch (err) {
      rollback(); // revert if network fails
      showSnackbar(err.message || 'Failed to toggle like. Please retry.', 'error');
    }
  };

  const handleExpandComments = useCallback(() => {
    setCommentsExpanded((prev) => {
      const next = !prev;
      if (next) {
        // Run focus on input field ref after animations mount
        setTimeout(() => {
          if (commentInputRef.current) {
            commentInputRef.current.focus();
          }
        }, 100);
      }
      return next;
    });
  }, []);

  // Compute total comments and replies count
  const totalCommentsCount = post.comments.reduce(
    (acc, comment) => acc + 1 + (comment.replies ? comment.replies.length : 0),
    0
  );

  return (
    <Card
      sx={{
        mb: { xs: 1.5, sm: 3 },
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
        border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e5e7eb',
        borderRadius: { xs: 0, sm: '12px' },
        position: 'relative',
        ...(post.isPromoted && {
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(212, 175, 55, 0.08)' : '#fffdf3',
          border: '2px solid #d4af37',
          boxShadow: (theme) => theme.palette.mode === 'dark' ? '0px 6px 18px rgba(212, 175, 55, 0.25)' : '0px 6px 18px rgba(212, 175, 55, 0.15)',
        }),
      }}
    >
      {post.isPromoted && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            backgroundColor: '#d4af37',
            color: '#fff',
            px: 2,
            py: 0.5,
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
          }}
        >
          <PromoteIcon active style={{ width: 12, height: 12, marginRight: 2, display: 'inline-block', verticalAlign: 'middle' }} />
          <span style={{ verticalAlign: 'middle' }}>Featured</span>
        </Box>
      )}
      {/* Header Info */}
      <CardHeader
        avatar={
          <Avatar
            sx={{
              background: getGradientForUsername(post.username),
              fontWeight: 700,
              border: '1px solid rgba(25, 118, 210, 0.1)',
            }}
          >
            {post.username ? post.username[0].toUpperCase() : 'U'}
          </Avatar>
        }
        action={
          user && post.userId === user._id && (
            <>
              <IconButton aria-label="settings" onClick={handleMenuOpen} size="small">
                <MoreIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: 2,
                      boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
                    }
                  }
                }}
              >
                <MenuItem onClick={handleEditClick} sx={{ fontSize: '0.85rem', fontWeight: 600, py: 0.8, px: 2, display: 'flex', gap: 1 }}>
                  <EditOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <span>Edit Post</span>
                </MenuItem>
                <MenuItem onClick={handleDeleteClick} sx={{ fontSize: '0.85rem', fontWeight: 600, py: 0.8, px: 2, color: 'error.main', display: 'flex', gap: 1 }}>
                  <DeleteOutlineIcon sx={{ fontSize: 18, color: 'error.main' }} />
                  <span>Delete Post</span>
                </MenuItem>
              </Menu>
            </>
          )
        }
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                color: 'text.primary',
                fontSize: '0.95rem',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {post.username}
            </Typography>
            {isVerifiedUser(post.username) && (
              <VerifiedIcon sx={{ fontSize: 16, color: '#1d9bf0', ml: -0.5 }} />
            )}
            {user && post.userId !== user._id && (
              <Button
                size="small"
                variant={isFollowing ? "text" : "outlined"}
                color={isFollowing ? "secondary" : "primary"}
                onClick={() => {
                  setIsFollowing(!isFollowing);
                  showSnackbar(isFollowing ? `Unfollowed ${post.username}` : `Following ${post.username}`, 'info');
                }}
                sx={{
                  py: 0.1,
                  px: 1,
                  height: 22,
                  minWidth: 'auto',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  borderRadius: 3,
                  borderWidth: '1px !important',
                }}
              >
                {isFollowing ? '✓ Following' : '+ Follow'}
              </Button>
            )}
            {(post.likes.length + totalCommentsCount >= 5) && (
              <Chip
                icon={<TrendingIcon style={{ color: '#e64a19' }} />}
                label="Trending"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(255, 87, 34, 0.08)',
                  color: '#e64a19',
                  border: '1px solid rgba(255, 87, 34, 0.15)',
                  '& .MuiChip-label': { px: 0.8 },
                }}
              />
            )}
          </Box>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              {formatRelativeTime(post.createdAt)}
            </Typography>
            <Typography variant="caption" color="text.secondary">•</Typography>
            <Chip
              label={post.category || 'General'}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.68rem',
                fontWeight: 700,
                backgroundColor: 'rgba(25, 118, 210, 0.06)',
                color: 'primary.main',
                border: '1px solid rgba(25, 118, 210, 0.1)',
                borderRadius: '4px',
                '& .MuiChip-label': { px: 0.6 },
              }}
            />
          </Box>
        }
      />

      {/* Post Content */}
      {post.text && (
        <CardContent
          sx={{ pt: 0, pb: 1.5, cursor: 'pointer' }}
          onClick={() => setDetailModalOpen(true)}
        >
          {post.text.length <= 280 ? (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', fontSize: '0.95rem' }}>
              {post.text}
            </Typography>
          ) : (
            <Box>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', fontSize: '0.95rem', display: 'inline' }}>
                {textExpanded ? post.text : `${post.text.substring(0, 280)}...`}
              </Typography>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setTextExpanded((prev) => !prev);
                }}
                sx={{
                  display: 'inline-flex',
                  p: 0,
                  ml: 0.5,
                  minWidth: 'auto',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'primary.main',
                  textTransform: 'none',
                  verticalAlign: 'baseline',
                  '&:hover': { background: 'none', textDecoration: 'underline' }
                }}
              >
                {textExpanded ? 'Read Less' : 'Read More'}
              </Button>
            </Box>
          )}
        </CardContent>
      )}

      {/* Poll Renderer */}
      {post.poll && (
        <CardContent sx={{ pt: 0, pb: 2 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1.5, 
              p: 2, 
              borderRadius: '12px', 
              border: (theme) => `1px solid ${theme.palette.divider}`,
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : '#fbfcfd'
            }}
          >
            {post.poll.options.map((opt) => {
              const optPercent = getOptionPercentage(opt.votes.length);
              const isUserChoice = opt.votes.includes(user?._id);
              return (
                <Box 
                  key={opt._id}
                  onClick={() => !hasVoted && handleVote(opt._id)}
                  sx={{
                    position: 'relative',
                    p: '12px 16px',
                    borderRadius: '8px',
                    border: (theme) => `1px solid ${isUserChoice ? theme.palette.primary.main : theme.palette.divider}`,
                    cursor: hasVoted ? 'default' : 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease-in-out',
                    ...(!hasVoted && {
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(25, 118, 210, 0.02)',
                      }
                    })
                  }}
                >
                  {/* Progress background bar */}
                  {hasVoted && (
                    <Box 
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: `${optPercent}%`,
                        backgroundColor: isUserChoice ? (mode === 'dark' ? 'rgba(144, 202, 249, 0.15)' : 'rgba(25, 118, 210, 0.12)') : (mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.04)'),
                        zIndex: 1,
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  )}
                  
                  {/* Content (Z-Index above progress bar) */}
                  <Box 
                    sx={{ 
                      position: 'relative', 
                      zIndex: 2, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center' 
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isUserChoice ? 700 : 500,
                        color: 'text.primary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      {opt.text}
                      {isUserChoice && <span style={{ color: mode === 'dark' ? '#90caf9' : '#1976d2', fontSize: '0.85rem' }}>✓</span>}
                    </Typography>
                    {hasVoted && (
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                        {optPercent}%
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {totalPollVotes} {totalPollVotes === 1 ? 'vote' : 'votes'}
              </Typography>
              {hasVoted && (
                <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                  Thanks for voting!
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      )}

      {/* Post Image (if present) */}
      {post.image && (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
            borderTop: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.03)',
            borderBottom: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'center',
            cursor: imageError ? 'default' : 'pointer',
            minHeight: imageError ? 'auto' : 200,
            '&:hover img': {
              filter: 'brightness(0.95)',
              transform: 'scale(1.005)',
            },
          }}
          onClick={imageError ? null : handleImageClick}
          onDoubleClick={imageError ? null : handleImageDoubleClick}
        >
          {imageError ? (
            <Box
              sx={{
                width: '100%',
                py: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
                gap: 1.5,
              }}
            >
              <ImageIcon size={32} style={{ opacity: 0.5 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.8, letterSpacing: 0.2 }}>
                Image unavailable (Render Ephemeral disk reset)
              </Typography>
            </Box>
          ) : (
            <>
              {!imageLoaded && (
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="100%"
                  animation="wave"
                  sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              )}
              <img
                ref={imgRef}
                src={getImageUrl(post.image)}
                alt="Post media (click to view full screen, double click to like)"
                style={{
                  width: '100%',
                  maxHeight: 450,
                  objectFit: 'contain',
                  transition: 'opacity 0.25s ease-in-out',
                  opacity: imageLoaded ? 1 : 0,
                  display: 'block',
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          )}
          
          {showHeartPop && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
                pointerEvents: 'none',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                animation: 'heartPopAnim 0.8s ease-out forwards',
                '@keyframes heartPopAnim': {
                  '0%': { transform: 'translate(-50%, -50%) scale(0) rotate(-15deg)', opacity: 0 },
                  '15%': { transform: 'translate(-50%, -50%) scale(1.2) rotate(0deg)', opacity: 0.9 },
                  '50%': { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 0.9 },
                  '100%': { transform: 'translate(-50%, -50%) scale(1.8) rotate(15deg)', opacity: 0 },
                }
              }}
            >
              <FavoriteIcon sx={{ fontSize: 80, color: '#ff1744', filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.3))' }} />
            </Box>
          )}
        </Box>
      )}

      {/* Action Buttons: Like / Comment counts */}
      <Box sx={{ px: 2, pt: 1, display: 'flex', alignItems: 'center', pb: 0.8, gap: 1.5, borderTop: '1px solid rgba(0,0,0,0.03)' }}>
        <Box 
          onClick={() => post.likes.length > 0 && setLikesModalOpen(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: post.likes.length > 0 ? 'pointer' : 'default',
            color: 'text.secondary',
            '&:hover': {
              color: post.likes.length > 0 ? 'primary.main' : 'text.secondary',
            }
          }}
        >
          <LikeIcon liked={post.likes.length > 0} style={{ width: 14, height: 14 }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: '0.78rem',
              color: 'inherit',
            }}
          >
            {post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}
          </Typography>
        </Box>
        
        <Box 
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'text.secondary',
          }}
        >
          <CommentIcon style={{ width: 14, height: 14 }} />
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 600, 
              fontSize: '0.78rem',
              color: 'inherit',
            }}
          >
            {totalCommentsCount} {totalCommentsCount === 1 ? 'Comment' : 'Comments'}
          </Typography>
        </Box>
      </Box>

      {/* Interaction Actions */}
      <CardActions sx={{ px: 1, py: 0.5, borderTop: '1px solid rgba(0,0,0,0.04)', justifyContent: 'space-around', gap: { xs: 0.2, sm: 0.5 } }}>
        <Button
          size="medium"
          color={isLikedByMe ? 'primary' : 'inherit'}
          onClick={handleLikeClick}
          startIcon={
            <LikeIcon 
              liked={isLikedByMe} 
              style={{
                transform: likeAnimated ? 'scale(1.3)' : 'scale(1)',
                transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }} 
            />
          }
          sx={{
            flexGrow: 1,
            borderRadius: '8px',
            color: isLikedByMe ? 'primary.main' : 'text.secondary',
            py: 1,
            px: { xs: 0.5, sm: 1.5 },
            fontWeight: 700,
            fontSize: { xs: '0.72rem', sm: '0.82rem' },
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              color: 'primary.main',
            },
          }}
          aria-label={isLikedByMe ? 'Unlike post' : 'Like post'}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {isLikedByMe ? 'Liked' : 'Like'}
          </Box>
        </Button>
        
        <Button
          size="medium"
          color="inherit"
          onClick={() => setDetailModalOpen(true)}
          startIcon={<CommentIcon />}
          sx={{
            flexGrow: 1,
            borderRadius: '8px',
            color: 'text.secondary',
            py: 1,
            px: { xs: 0.5, sm: 1.5 },
            fontWeight: 600,
            fontSize: { xs: '0.72rem', sm: '0.82rem' },
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(46, 125, 50, 0.08)',
              color: 'success.main',
            },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Comment
          </Box>
        </Button>
 
        <Button
          size="medium"
          color="inherit"
          onClick={() => {
            const mockLink = `${window.location.origin}/post/${post._id}`;
            navigator.clipboard.writeText(mockLink);
            showSnackbar('Post link copied to clipboard!', 'success');
          }}
          startIcon={<ShareIcon />}
          sx={{
            flexGrow: 1,
            borderRadius: '8px',
            color: 'text.secondary',
            py: 1,
            px: { xs: 0.5, sm: 1.5 },
            fontWeight: 600,
            fontSize: { xs: '0.72rem', sm: '0.82rem' },
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(2, 136, 209, 0.08)',
              color: 'info.main',
            },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Share
          </Box>
        </Button>
 
        {user && post.userId === user._id && (
          <Button
            size="medium"
            color="inherit"
            onClick={() => setPromoteDialogOpen(true)}
            startIcon={<PromoteIcon active={post.isPromoted} />}
            sx={{
              flexGrow: 1,
              borderRadius: '8px',
              color: post.isPromoted ? '#d4af37' : 'text.secondary',
              py: 1,
              px: { xs: 0.5, sm: 1.5 },
              fontSize: { xs: '0.72rem', sm: '0.82rem' },
              fontWeight: post.isPromoted ? 700 : 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(212, 175, 55, 0.08)',
                color: '#d4af37',
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {post.isPromoted ? 'Featured' : 'Promote'}
            </Box>
          </Button>
        )}
      </CardActions>

      {/* Expandable Comments Drawer */}
      <Collapse in={commentsExpanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0, pb: 2 }}>
          <CommentSection
            postId={post._id}
            comments={post.comments}
            onCommentAdded={onCommentAdded}
            onReplyAdded={onReplyAdded}
            showSnackbar={showSnackbar}
            commentInputRef={commentInputRef}
          />
        </CardContent>
      </Collapse>

      {/* LinkedIn-Style Split Pane Post Detail Dialog */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={window.innerWidth < 600}
        slotProps={{
          paper: {
            sx: {
              borderRadius: { xs: 0, sm: '12px' },
              overflow: 'hidden',
              maxHeight: { xs: '100vh', sm: '90vh' },
              m: { xs: 0, sm: 2 },
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: { xs: '85vh', md: '80vh' } }}>
          {/* Left Media Panel */}
          {post.image && !imageError && (
            <Box
              sx={{
                width: { xs: '100%', md: '55%' },
                height: { xs: '220px', md: '100%' },
                backgroundColor: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <img
                src={getImageUrl(post.image)}
                alt="Post media details view"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}

          {/* Right Interactive Panel */}
          <Box
            sx={{
              width: { xs: '100%', md: (post.image && !imageError) ? '45%' : '100%' },
              height: { xs: (post.image && !imageError) ? 'calc(85vh - 220px)' : '85vh', md: '100%' },
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'background.paper',
            }}
          >
            {/* Modal Header */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    background: getGradientForUsername(post.username),
                    fontWeight: 700,
                    width: 36,
                    height: 36,
                  }}
                >
                  {post.username ? post.username[0].toUpperCase() : 'U'}
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {post.username}
                    </Typography>
                    {isVerifiedUser(post.username) && (
                      <VerifiedIcon sx={{ fontSize: 14, color: '#1d9bf0' }} />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatRelativeTime(post.createdAt)}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setDetailModalOpen(false)} size="small" aria-label="Close detail modal">
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Scrollable Body Content */}
            <Box
              sx={{
                p: 2.5,
                flexGrow: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {/* Post Text */}
              {post.text && (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {post.text}
                </Typography>
              )}

              {/* Category Tag */}
              <Box>
                <Chip
                  label={post.category || 'General'}
                  size="small"
                  sx={{
                    borderRadius: 1,
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    color: 'primary.main',
                  }}
                />
              </Box>

              {/* Poll Renderer inside Modal */}
              {post.poll && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 1.2, 
                    p: 2, 
                    borderRadius: '12px', 
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : '#fbfcfd'
                  }}
                >
                  {post.poll.options.map((opt) => {
                    const optPercent = getOptionPercentage(opt.votes.length);
                    const isUserChoice = opt.votes.includes(user?._id);
                    return (
                      <Box 
                        key={opt._id}
                        onClick={() => !hasVoted && handleVote(opt._id)}
                        sx={{
                          position: 'relative',
                          p: '10px 14px',
                          borderRadius: '8px',
                          border: (theme) => `1px solid ${isUserChoice ? theme.palette.primary.main : theme.palette.divider}`,
                          cursor: hasVoted ? 'default' : 'pointer',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease-in-out',
                          ...(!hasVoted && {
                            '&:hover': {
                              borderColor: 'primary.main',
                              backgroundColor: 'rgba(25, 118, 210, 0.02)',
                            }
                          })
                        }}
                      >
                        {/* Progress background bar */}
                        {hasVoted && (
                          <Box 
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              bottom: 0,
                              width: `${optPercent}%`,
                              backgroundColor: isUserChoice ? (mode === 'dark' ? 'rgba(144, 202, 249, 0.15)' : 'rgba(25, 118, 210, 0.12)') : (mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.04)'),
                              zIndex: 1,
                              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          />
                        )}
                        
                        {/* Content */}
                        <Box 
                          sx={{ 
                            position: 'relative', 
                            zIndex: 2, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: isUserChoice ? 700 : 500,
                              color: 'text.primary',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              fontSize: '0.82rem'
                            }}
                          >
                            {opt.text}
                            {isUserChoice && <span style={{ color: mode === 'dark' ? '#90caf9' : '#1976d2', fontSize: '0.85rem' }}>✓</span>}
                          </Typography>
                          {hasVoted && (
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.82rem' }}>
                              {optPercent}%
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {totalPollVotes} {totalPollVotes === 1 ? 'vote' : 'votes'}
                    </Typography>
                    {hasVoted && (
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                        Thanks for voting!
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              <Divider sx={{ borderColor: (theme) => theme.palette.divider }} />

              {/* Likes/Comments Counter */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box 
                  onClick={() => post.likes.length > 0 && setLikesModalOpen(true)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: post.likes.length > 0 ? 'pointer' : 'default',
                    color: 'text.secondary',
                    '&:hover': {
                      color: post.likes.length > 0 ? 'primary.main' : 'text.secondary',
                    }
                  }}
                >
                  <LikeIcon liked={post.likes.length > 0} style={{ width: 14, height: 14 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: 'inherit',
                    }}
                  >
                    {post.likes.length} Likes
                  </Typography>
                </Box>
                
                <Box 
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'text.secondary',
                  }}
                >
                  <CommentIcon style={{ width: 14, height: 14 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'inherit' }}>
                    {totalCommentsCount} Comments
                  </Typography>
                </Box>
              </Box>

              {/* Interactions Actions inside modal */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  py: 0.5,
                  borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                  borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                  gap: 0.5,
                }}
              >
                <Button
                  size="small"
                  color={isLikedByMe ? 'primary' : 'inherit'}
                  onClick={handleLikeClick}
                  startIcon={
                    <LikeIcon 
                      liked={isLikedByMe} 
                      style={{
                        transform: likeAnimated ? 'scale(1.3)' : 'scale(1)',
                        transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      }} 
                    />
                  }
                  sx={{
                    flexGrow: 1,
                    py: 0.8,
                    borderRadius: '8px',
                    color: isLikedByMe ? 'primary.main' : 'text.secondary',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      color: 'primary.main',
                    },
                  }}
                >
                  Like
                </Button>
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => {
                    const mockLink = `${window.location.origin}/post/${post._id}`;
                    navigator.clipboard.writeText(mockLink);
                    showSnackbar('Post link copied to clipboard!', 'success');
                  }}
                  startIcon={<ShareIcon />}
                  sx={{ 
                    flexGrow: 1, 
                    py: 0.8, 
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'rgba(2, 136, 209, 0.08)',
                      color: 'info.main',
                    },
                  }}
                >
                  Share
                </Button>
              </Box>

              {/* Comments list fully opened */}
              <CommentSection
                postId={post._id}
                comments={post.comments}
                onCommentAdded={onCommentAdded}
                onReplyAdded={onReplyAdded}
                showSnackbar={showSnackbar}
                commentInputRef={commentInputRef}
              />
            </Box>
          </Box>
        </Box>
      </Dialog>

      {/* Edit Post Dialog popup */}
      <EditPostDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        post={post}
        onPostUpdated={onPostUpdated}
        showSnackbar={showSnackbar}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-post-dialog-title"
      >
        <Box sx={{ p: 3, maxWidth: 400 }}>
          <Typography id="delete-post-dialog-title" variant="h6" fontWeight="bold" gutterBottom>
            Delete Post?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Are you sure you want to permanently delete this post? This action cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button variant="outlined" onClick={() => setDeleteConfirmOpen(false)} sx={{ borderRadius: 4 }}>
              Cancel
            </Button>
            <Button variant="contained" color="error" onClick={handleDeleteConfirm} sx={{ borderRadius: 4 }}>
              Delete
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Liked By Dialog */}
      <Dialog
        open={likesModalOpen}
        onClose={() => setLikesModalOpen(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="liked-by-dialog-title"
      >
        <Box sx={{ p: 3 }}>
          <Typography id="liked-by-dialog-title" variant="h6" fontWeight="bold" gutterBottom>
            Liked By
          </Typography>
          <List sx={{ pt: 0, maxHeight: 300, overflowY: 'auto' }}>
            {post.likes.map((like) => (
              <ListItem key={like.userId} disableGutters sx={{ py: 1 }}>
                <Avatar sx={{ background: getGradientForUsername(like.username), mr: 2, width: 32, height: 32, fontSize: '0.85rem', fontWeight: 700 }}>
                  {like.username ? like.username[0].toUpperCase() : 'U'}
                </Avatar>
                <ListItemText
                  primary={like.username}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                />
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="contained" onClick={() => setLikesModalOpen(false)} sx={{ borderRadius: 4 }}>
              Close
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Promote Post Dialog */}
      <Dialog
        open={promoteDialogOpen}
        onClose={() => setPromoteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="promote-dialog-title"
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <PromoteIcon active style={{ width: 48, height: 48, color: '#1976d2' }} />
          </Box>
          <Typography id="promote-dialog-title" variant="h6" fontWeight="bold" gutterBottom>
            {post.isPromoted ? 'Remove Feature Boost?' : 'Boost Post to Featured?'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {post.isPromoted
              ? 'Are you sure you want to remove this post from the Featured promotions feed?'
              : 'Maximize your reach! Boosting this post will pin it with a gold border, label it "Featured", and display it inside the Promotions tab.'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={() => setPromoteDialogOpen(false)} sx={{ borderRadius: 4, flex: 1 }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handlePromoteConfirm} sx={{ borderRadius: 4, flex: 1 }}>
              {post.isPromoted ? 'Remove Boost' : 'Boost Post'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Card>
  );
};

// Wrap component to avoid re-renders unless props change
export default memo(PostCard);
