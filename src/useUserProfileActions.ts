import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';
import { useToast } from './Toast';
import type { PublicUserProfile } from './types';

/**
 * Shared Message/Follow logic for both the UserProfileCard popover and the
 * full UserProfile.tsx page, so the two don't duplicate the conversation
 * creation and follow-toggle calls (and their toasts/error handling).
 */
export function useUserProfileActions(profile: PublicUserProfile | null) {
  const navigate = useNavigate();
  const showToast = useToast();
  const [isFollowing, setIsFollowing] = useState(profile?.isFollowing ?? false);
  const [isMessaging, setIsMessaging] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  const messageUser = useCallback(async () => {
    if (!profile || isMessaging) return;
    setIsMessaging(true);
    try {
      let conversationId = profile.existingConversationId;
      let isRequest = false;
      if (!conversationId) {
        const res = await api.createConversation({ participantIds: [profile.id] });
        conversationId = res.data.data!.id;
        isRequest = res.data.data!.isRequest;
      }
      navigate(`/messages?conversation=${conversationId}`);
      if (isRequest) showToast('Message request sent');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to start conversation');
    } finally {
      setIsMessaging(false);
    }
  }, [profile, isMessaging, navigate, showToast]);

  const toggleFollow = useCallback(async () => {
    if (!profile || isTogglingFollow) return;
    setIsTogglingFollow(true);
    try {
      const res = await api.toggleCommunityFollow(profile.id);
      setIsFollowing(res.data.data!.following);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update follow');
    } finally {
      setIsTogglingFollow(false);
    }
  }, [profile, isTogglingFollow, showToast]);

  return { isFollowing, isMessaging, isTogglingFollow, messageUser, toggleFollow };
}
