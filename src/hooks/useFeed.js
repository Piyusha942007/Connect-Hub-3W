import { useState, useCallback, useEffect } from 'react';
import { fetchPosts } from '../services/apiService';

export const useFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  const newestPostCreatedAt = posts[0]?.createdAt;

  // Background sync polling: silent feed updates & new posts detection every 15 seconds
  useEffect(() => {
    if (posts.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const loadedLimit = posts.length;
        const data = await fetchPosts(1, loadedLimit, selectedCategory, searchQuery, sortBy);

        // Silent merge: updates only likes, comments, and replies for loaded posts without disturbing cursor inputs
        setPosts((prevPosts) => {
          const polledMap = new Map(data.posts.map((p) => [p._id, p]));

          return prevPosts.map((post) => {
            const updatedPost = polledMap.get(post._id);
            if (!updatedPost) return post;

            return {
              ...post,
              likes: updatedPost.likes,
              comments: updatedPost.comments,
            };
          });
        });

        // Detect brand new posts created since feed loaded
        if (newestPostCreatedAt) {
          const cutOffTime = new Date(newestPostCreatedAt).getTime();
          const brandNewPosts = data.posts.filter(
            (p) => new Date(p.createdAt).getTime() > cutOffTime
          );
          if (brandNewPosts.length > 0) {
            setNewPostsCount(brandNewPosts.length);
          }
        }
      } catch (err) {
        console.warn('[Sync Error] Background polling failed:', err);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [posts.length, newestPostCreatedAt, selectedCategory, searchQuery, sortBy]);

  // Load page 1 of feed
  const loadInitialFeed = useCallback(async (limit = 10, categoryFilter = selectedCategory, searchFilter = searchQuery, sortFilter = sortBy) => {
    setLoading(true);
    setError(null);
    setNewPostsCount(0); // Reset polling banner on feed refresh
    try {
      const data = await fetchPosts(1, limit, categoryFilter, searchFilter, sortFilter);
      setPosts(data.posts);
      setPage(1);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err.message || 'Failed to retrieve social feed.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  // Load next pages of feed
  const loadNextPage = useCallback(async (limit = 10) => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const nextPage = page + 1;
      const data = await fetchPosts(nextPage, limit, selectedCategory, searchQuery, sortBy);
      
      setPosts((prevPosts) => {
        // Prevent duplicate keys by filtering existing posts
        const existingIds = new Set(prevPosts.map((p) => p._id));
        const filteredNew = data.posts.filter((p) => !existingIds.has(p._id));
        return [...prevPosts, ...filteredNew];
      });
      setPage(nextPage);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err.message || 'Failed to load more posts.');
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, selectedCategory, searchQuery, sortBy]);

  // Insert a new post at the top of the feed list
  const addPostLocally = useCallback((newPost) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  }, []);


  // Optimistic update wrapper for toggling likes
  const updateLikesOptimistically = useCallback((postId, currentUserId, currentUsername) => {
    let rollbackPosts = null;

    setPosts((prevPosts) => {
      rollbackPosts = [...prevPosts];
      return prevPosts.map((post) => {
        if (post._id !== postId) return post;

        const likedIndex = post.likes.findIndex((like) => like.userId === currentUserId);
        let newLikes = [...post.likes];

        if (likedIndex > -1) {
          // Unlike optimistically
          newLikes.splice(likedIndex, 1);
        } else {
          // Like optimistically
          newLikes.push({ userId: currentUserId, username: currentUsername });
        }

        return { ...post, likes: newLikes };
      });
    });

    // Return rollback handler
    return () => setPosts(rollbackPosts);
  }, []);

  // Set real likes list after API completes
  const commitLikes = useCallback((postId, likesArray) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post._id === postId ? { ...post, likes: likesArray } : post))
    );
  }, []);

  // Optimistic update wrapper for adding comments
  const addCommentOptimistically = useCallback((postId, tempComment) => {
    let rollbackPosts = null;

    setPosts((prevPosts) => {
      rollbackPosts = [...prevPosts];
      return prevPosts.map((post) => {
        if (post._id !== postId) return post;
        return {
          ...post,
          comments: [...post.comments, tempComment],
        };
      });
    });

    // Return rollback handler
    return () => setPosts(rollbackPosts);
  }, []);

  // Set real comments list after API completes
  const commitComments = useCallback((postId, commentsArray) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post._id === postId ? { ...post, comments: commentsArray } : post))
    );
  }, []);

  // Optimistic update wrapper for adding replies
  const addReplyOptimistically = useCallback((postId, commentId, tempReply) => {
    let rollbackPosts = null;

    setPosts((prevPosts) => {
      rollbackPosts = [...prevPosts];
      return prevPosts.map((post) => {
        if (post._id !== postId) return post;

        const updatedComments = post.comments.map((comment) => {
          if (comment._id !== commentId) return comment;
          return {
            ...comment,
            replies: [...(comment.replies || []), tempReply],
          };
        });

        return { ...post, comments: updatedComments };
      });
    });

    // Return rollback handler
    return () => setPosts(rollbackPosts);
  }, []);

  // Update a post in the feed list after successful API edit
  const updatePostLocally = useCallback((updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post))
    );
  }, []);

  // Remove a post from the local feed state after successful deletion
  const deletePostLocally = useCallback((postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
  }, []);

  const changeCategory = useCallback((category) => {
    setSelectedCategory(category);
    loadInitialFeed(10, category, searchQuery, sortBy);
  }, [loadInitialFeed, searchQuery, sortBy]);

  const changeSearchQuery = useCallback((search) => {
    setSearchQuery(search);
    loadInitialFeed(10, selectedCategory, search, sortBy);
  }, [loadInitialFeed, selectedCategory, sortBy]);

  const changeSortBy = useCallback((sort) => {
    setSortBy(sort);
    loadInitialFeed(10, selectedCategory, searchQuery, sort);
  }, [loadInitialFeed, selectedCategory, searchQuery]);

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    selectedCategory,
    newPostsCount,
    searchQuery,
    sortBy,
    loadInitialFeed,
    loadNextPage,
    addPostLocally,
    updateLikesOptimistically,
    commitLikes,
    addCommentOptimistically,
    commitComments,
    addReplyOptimistically,
    updatePostLocally,
    deletePostLocally,
    changeCategory,
    changeSearchQuery,
    changeSortBy,
    setNewPostsCount,
  };
};
