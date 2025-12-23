import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '@/navigation/AppNavigator';
import WatercolorBackdrop from '@/components/watercolor/WatercolorBackdrop';
import WatercolorCard from '@/components/watercolor/WatercolorCard';
import WatercolorButton from '@/components/watercolor/WatercolorButton';
import { SPACING } from '@/core/theme/spacing';
import {
  addBuildUpdate,
  applyToPartnership,
  BuildProject,
  createBuildProject,
  createPartnershipPost,
  followBuildProject,
  getBuildProjects,
  getPartnershipApplications,
  getPartnershipPosts,
  PartnershipApplication,
  PartnershipPost,
  reportPartnershipPost,
  unfollowBuildProject,
  updateApplicationStatus,
  blockUser,
} from '@/services/communityService';
import { supabase } from '@/services/supabase';

const TABS: Array<{ key: 'partnerships' | 'build'; label: string }> = [
  { key: 'build', label: 'Build in Public' },
  { key: 'partnerships', label: 'Partnerships' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'CollaborationHub'>;

const CollaborationHubScreen: React.FC<Props> = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState<'partnerships' | 'build'>(route.params?.initialTab ?? 'build');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [partnerships, setPartnerships] = useState<PartnershipPost[]>([]);
  const [partnershipLoading, setPartnershipLoading] = useState(false);
  const [projects, setProjects] = useState<BuildProject[]>([]);
  const [projectLoading, setProjectLoading] = useState(false);

  const [createListingVisible, setCreateListingVisible] = useState(false);
  const [listingForm, setListingForm] = useState({
    headline: '',
    projectSummary: '',
    lookingFor: '',
    whyYou: '',
    contact: '',
    skills: '',
    commitment: '',
  });

  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PartnershipPost | null>(null);
  const [applicationForm, setApplicationForm] = useState({ pitch: '', experience: '', contact: '' });

  const [applicationsVisible, setApplicationsVisible] = useState(false);
  const [applications, setApplications] = useState<PartnershipApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const [postDetailsVisible, setPostDetailsVisible] = useState(false);
  const [postDetails, setPostDetails] = useState<PartnershipPost | null>(null);

  const [createProjectVisible, setCreateProjectVisible] = useState(false);
  const [projectForm, setProjectForm] = useState({ title: '', summary: '', goal: '', tags: '', category: '' });

  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<BuildProject | null>(null);
  const [updateForm, setUpdateForm] = useState({ content: '', progress: '', milestone: '' });

  const loadCurrentUser = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
    } catch (error) {
      console.warn('[CollaborationHub] failed to load user', error);
    }
  }, []);

  const refreshPartnerships = useCallback(async () => {
    setPartnershipLoading(true);
    try {
      const data = await getPartnershipPosts();
      setPartnerships(data);
    } catch (error) {
      Alert.alert('Unable to load partnerships', error instanceof Error ? error.message : 'Please try again later.');
    } finally {
      setPartnershipLoading(false);
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    setProjectLoading(true);
    try {
      const data = await getBuildProjects();
      setProjects(data);
    } catch (error) {
      Alert.alert('Unable to load projects', error instanceof Error ? error.message : 'Please try again later.');
    } finally {
      setProjectLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
    refreshPartnerships();
    refreshProjects();
  }, [loadCurrentUser, refreshPartnerships, refreshProjects]);

  const handleCreateListing = async () => {
    if (!listingForm.headline.trim() || !listingForm.projectSummary.trim() || !listingForm.lookingFor.trim()) {
      Alert.alert('Missing fields', 'Please fill in the headline, what you are building, and what you need.');
      return;
    }

    try {
      await createPartnershipPost({
        headline: listingForm.headline.trim(),
        projectSummary: listingForm.projectSummary.trim(),
        lookingFor: listingForm.lookingFor.trim(),
        whyYou: listingForm.whyYou.trim(),
        contact: listingForm.contact.trim(),
        skills: listingForm.skills
          .split(',')
          .map(skill => skill.trim())
          .filter(Boolean),
        commitment: listingForm.commitment.trim() || undefined,
      });
      setCreateListingVisible(false);
      setListingForm({ headline: '', projectSummary: '', lookingFor: '', whyYou: '', contact: '', skills: '', commitment: '' });
      refreshPartnerships();
    } catch (error) {
      Alert.alert('Unable to create listing', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const openPostDetails = (post: PartnershipPost) => {
    setPostDetails(post);
    setSelectedPost(post);
    setPostDetailsVisible(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedPost) return;
    if (!applicationForm.pitch.trim() || !applicationForm.contact.trim()) {
      Alert.alert('Missing info', 'Share why you are a great partner and how to reach you.');
      return;
    }

    try {
      await applyToPartnership(selectedPost.id, {
        pitch: applicationForm.pitch.trim(),
        experience: applicationForm.experience.trim(),
        contact: applicationForm.contact.trim(),
      });
      setApplyModalVisible(false);
      setApplicationForm({ pitch: '', experience: '', contact: '' });
      refreshPartnerships();
      Alert.alert('Application sent', 'They will review your request soon.');
    } catch (error) {
      Alert.alert('Unable to apply', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const openApplications = async (post: PartnershipPost) => {
    setSelectedPost(post);
    setApplicationsVisible(true);
    setApplicationsLoading(true);
    try {
      const data = await getPartnershipApplications(post.id);
      setApplications(data);
    } catch (error) {
      Alert.alert('Unable to load applications', error instanceof Error ? error.message : 'Please try again later.');
      setApplicationsVisible(false);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleApplicationStatus = async (applicationId: string, status: 'accepted' | 'declined') => {
    try {
      await updateApplicationStatus(applicationId, status);
      setApplications(prev => prev.map(app => (app.id === applicationId ? { ...app, status } : app)));
    } catch (error) {
      Alert.alert('Unable to update', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleCreateProject = async () => {
    if (!projectForm.title.trim() || !projectForm.summary.trim()) {
      Alert.alert('Missing info', 'Give your project a title and summary.');
      return;
    }

    try {
      await createBuildProject({
        title: projectForm.title.trim(),
        summary: projectForm.summary.trim(),
        goal: projectForm.goal.trim() || undefined,
        tags: projectForm.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean),
        category: projectForm.category.trim() || undefined,
      });
      setCreateProjectVisible(false);
      setProjectForm({ title: '', summary: '', goal: '', tags: '', category: '' });
      refreshProjects();
    } catch (error) {
      Alert.alert('Unable to create project', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleToggleFollow = async (project: BuildProject) => {
    try {
      if (project.is_following) {
        await unfollowBuildProject(project.id);
      } else {
        await followBuildProject(project.id);
      }
      setProjects(prev =>
        prev.map(item =>
          item.id === project.id
            ? {
                ...item,
                is_following: !project.is_following,
                followers_count: project.followers_count + (project.is_following ? -1 : 1),
              }
            : item,
        ),
      );
    } catch (error) {
      Alert.alert('Unable to update follow', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const getDisplayName = (profile?: { full_name?: string | null; username?: string | null }) => {
    if (!profile) return 'Creator';
    return profile.full_name || profile.username || 'Creator';
  };

  const getAvatarInitial = (profile?: { avatar_url?: string | null; full_name?: string | null; username?: string | null }) => {
    if (profile?.avatar_url && profile.avatar_url.trim()) {
      return null;
    }
    return getDisplayName(profile).trim().charAt(0).toUpperCase();
  };

  const renderAvatarBubble = (profile: { avatar_url?: string | null; full_name?: string | null; username?: string | null }) => {
    const initial = getAvatarInitial(profile);
    return (
      <View style={styles.avatarBubble}>
        {profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} /> : <Text style={styles.avatarInitial}>{initial}</Text>}
      </View>
    );
  };

  const handleReportOrBlock = (targetUserId: string, onReport: () => void) => {
    Alert.alert('Keep the community safe', 'Choose an action', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report content',
        onPress: onReport,
      },
      {
        text: 'Block user',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(targetUserId);
            Alert.alert('User blocked', 'They can no longer interact with you.');
          } catch (error) {
            Alert.alert('Unable to block user', error instanceof Error ? error.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleAddUpdate = async () => {
    if (!selectedProject) return;
    if (!updateForm.content.trim()) {
      Alert.alert('Missing update', 'Share what you shipped or learned.');
      return;
    }

    const progressPercent = updateForm.progress ? Number(updateForm.progress) : undefined;
    if (progressPercent !== undefined && (Number.isNaN(progressPercent) || progressPercent < 0 || progressPercent > 100)) {
      Alert.alert('Invalid progress', 'Enter a number between 0 and 100.');
      return;
    }

    try {
      await addBuildUpdate(selectedProject.id, {
        content: updateForm.content.trim(),
        progressPercent,
        milestone: updateForm.milestone.trim() || undefined,
      });
      setUpdateModalVisible(false);
      setUpdateForm({ content: '', progress: '', milestone: '' });
      setSelectedProject(null);
      refreshProjects();
      Alert.alert('Update shared', 'Your progress update is live.');
    } catch (error) {
      Alert.alert('Unable to publish update', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const openProjectThread = (project: BuildProject) => {
    navigation.navigate('BuildProjectThread', { projectId: project.id, initialProject: project });
  };

  const openProfile = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const formattedDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString();
  };

  const renderPartnershipCard = (post: PartnershipPost) => {
    const isOwner = post.creator.id === currentUserId;
    return (
      <WatercolorCard key={post.id} style={styles.card} backgroundColor="#fff">
        <TouchableOpacity activeOpacity={0.8} onPress={() => openPostDetails(post)}>
          <View style={styles.cardHeader}>
            <TouchableOpacity style={styles.cardHeaderInfo} onPress={() => openProfile(post.creator.id)}>
              <View style={styles.creatorRow}>
                {renderAvatarBubble(post.creator)}
                <View style={styles.creatorDetails}>
                  <Text style={styles.cardTitle}>{post.headline}</Text>
                  <Text style={styles.cardSubtitle}>by {getDisplayName(post.creator)}</Text>
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.statusBadge}>{post.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.cardBody}>{post.project_summary}</Text>
          <Text style={styles.cardLabel}>Looking for</Text>
          <Text style={styles.cardBody}>{post.looking_for}</Text>
          {post.skills?.length ? <Text style={styles.cardSkills}>Skills: {post.skills.join(', ')}</Text> : null}
        </TouchableOpacity>
        <View style={styles.cardFooter}>
          {!isOwner ? (
            <WatercolorButton
              color="blue"
              onPress={() => {
                setSelectedPost(post);
                setApplyModalVisible(true);
              }}
            >
              <Text style={styles.newButtonText}>{post.user_has_applied ? 'Applied' : 'Apply to partner'}</Text>
            </WatercolorButton>
          ) : (
            <TouchableOpacity style={styles.secondaryAction} onPress={() => openApplications(post)}>
              <Text style={styles.secondaryActionText}>{post.applications_count} Applicants</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.moreAction}
            onPress={() =>
              handleReportOrBlock(post.creator.id, () => {
                reportPartnershipPost(post.id, 'inappropriate');
                Alert.alert('Reported', 'Thanks for helping us moderate.');
              })
            }
          >
            <Text style={styles.moreActionText}>⋯</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.timestamp}>Updated {formattedDate(post.updated_at)}</Text>
      </WatercolorCard>
    );
  };

  const renderProjectCard = (project: BuildProject) => {
    const isOwner = project.owner.id === currentUserId;
    return (
      <WatercolorCard key={project.id} style={styles.card} backgroundColor="#fff">
        <TouchableOpacity activeOpacity={0.8} onPress={() => openProjectThread(project)}>
          <View style={styles.cardHeader}>
            <TouchableOpacity style={styles.cardHeaderInfo} onPress={() => openProfile(project.owner.id)}>
              <View style={styles.creatorRow}>
                {renderAvatarBubble(project.owner)}
                <View style={styles.creatorDetails}>
                  <Text style={styles.cardTitle}>{project.title}</Text>
                  <Text style={styles.cardSubtitle}>by {getDisplayName(project.owner)}</Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.followChip} onPress={() => handleToggleFollow(project)}>
              <Text style={styles.followChipText}>{project.is_following ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardBody}>{project.summary}</Text>
          <Text style={styles.cardLabel}>Goal</Text>
          <Text style={styles.cardBody}>{project.goal}</Text>
          {project.tags?.length ? <Text style={styles.cardSkills}>Tags: {project.tags.join(', ')}</Text> : null}
        </TouchableOpacity>
        <View style={styles.cardFooter}>
          {isOwner ? (
            <WatercolorButton
              color="blue"
              onPress={() => {
                setSelectedProject(project);
                setUpdateModalVisible(true);
              }}
            >
              <Text style={styles.newButtonText}>Add update</Text>
            </WatercolorButton>
          ) : (
            <TouchableOpacity style={styles.secondaryAction} onPress={() => openProjectThread(project)}>
              <Text style={styles.secondaryActionText}>Open Thread</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.moreAction}
            onPress={() =>
              handleReportOrBlock(project.owner.id, () => {
                Alert.alert('Reported', 'Thanks for helping us moderate.');
              })
            }
          >
            <Text style={styles.moreActionText}>⋯</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.timestamp}>Updated {formattedDate(project.created_at)}</Text>
      </WatercolorCard>
    );
  };
  const renderApplicationCard = (app: PartnershipApplication) => (
    <WatercolorCard key={app.id} style={styles.applicationCard}>
      <Text style={styles.cardSubtitle}>{getDisplayName(app.applicant)}</Text>
      <Text style={styles.cardBody}>{app.pitch}</Text>
      {app.experience ? <Text style={styles.cardBody}>Experience: {app.experience}</Text> : null}
      <Text style={styles.cardBody}>Contact: {app.contact_method}</Text>
      <Text style={styles.statusBadge}>{app.status.toUpperCase()}</Text>
      {app.status === 'pending' && (
        <View style={styles.applicationActions}>
          <TouchableOpacity onPress={() => handleApplicationStatus(app.id, 'accepted')}>
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleApplicationStatus(app.id, 'declined')}>
            <Text style={styles.rejectText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </WatercolorCard>
  );

  const renderPostDetails = () => {
    if (!postDetails) return null;
    return (
      <View style={styles.detailSection}>
        <Text style={styles.modalLabel}>{postDetails.status.toUpperCase()}</Text>
        <Text style={styles.modalTitle}>{postDetails.headline}</Text>
        <Text style={styles.modalBody}>{postDetails.project_summary}</Text>
        <Text style={styles.modalLabel}>Looking for</Text>
        <Text style={styles.modalBody}>{postDetails.looking_for}</Text>
        {postDetails.skills?.length ? (
          <View style={styles.detailMetaRow}>
            {postDetails.skills.map(skill => (
              <View key={skill} style={styles.metaChip}>
                <Text style={styles.modalBody}>{skill}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const isBuildTab = activeTab === 'build';
  const listEmpty = isBuildTab ? projects.length === 0 : partnerships.length === 0;
  const refreshing = isBuildTab ? projectLoading : partnershipLoading;
  const onRefresh = isBuildTab ? refreshProjects : refreshPartnerships;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      <WatercolorBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl tintColor="#1f2937" refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
              <Text style={styles.iconLabel}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Collaboration Hub</Text>
            <WatercolorButton
              color="yellow"
              onPress={() => (isBuildTab ? setCreateProjectVisible(true) : setCreateListingVisible(true))}
              style={styles.headerAction}
            >
              <Text style={styles.headerActionText}>{isBuildTab ? 'Share build' : 'New listing'}</Text>
            </WatercolorButton>
          </View>

          <View style={styles.tabRow}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabChip, activeTab === tab.key && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabChipText, activeTab === tab.key && styles.tabChipTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {listEmpty ? (
            <Text style={styles.emptyStateText}>
              {isBuildTab ? 'No build-in-public projects yet. Share your work!' : 'No partnership listings yet.'}
            </Text>
          ) : isBuildTab ? (
            projects.map(renderProjectCard)
          ) : (
            partnerships.map(renderPartnershipCard)
          )}
        </ScrollView>

        {/* Apply Modal */}
        <Modal visible={applyModalVisible} transparent animationType="slide" onRequestClose={() => setApplyModalVisible(false)}>
          <View style={[styles.modalOverlay, styles.modalOverlayCenter]}>
            <View style={[styles.modalContainer, styles.largeModal]}>
              <Text style={styles.modalTitle}>Submit application</Text>
              <TextInput
                placeholder="Why are you a great fit?"
                value={applicationForm.pitch}
                onChangeText={text => setApplicationForm(prev => ({ ...prev, pitch: text }))}
                style={[styles.input, styles.inputMultiline]}
                multiline
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                placeholder="Experience (optional)"
                value={applicationForm.experience}
                onChangeText={text => setApplicationForm(prev => ({ ...prev, experience: text }))}
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                placeholder="Preferred contact (email/phone)"
                value={applicationForm.contact}
                onChangeText={text => setApplicationForm(prev => ({ ...prev, contact: text }))}
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
              <WatercolorButton color="yellow" onPress={handleSubmitApplication}>
                <Text style={styles.newButtonText}>Submit</Text>
              </WatercolorButton>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setApplyModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Create Listing Modal */}
        <Modal visible={createListingVisible} transparent animationType="slide" onRequestClose={() => setCreateListingVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Create Partnership Listing</Text>
              <TextInput
                placeholder="Headline"
                value={listingForm.headline}
                onChangeText={text => setListingForm(prev => ({ ...prev, headline: text }))}
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                placeholder="Project summary"
                value={listingForm.projectSummary}
                onChangeText={text => setListingForm(prev => ({ ...prev, projectSummary: text }))}
                style={[styles.input, styles.inputMultiline]}
                multiline
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                placeholder="Looking for"
                value={listingForm.lookingFor}
                onChangeText={text => setListingForm(prev => ({ ...prev, lookingFor: text }))}
                style={[styles.input, styles.inputMultiline]}
                multiline
                placeholderTextColor="#94a3b8"
              />
              <WatercolorButton color="yellow" onPress={handleCreateListing}>
                <Text style={styles.newButtonText}>Publish listing</Text>
              </WatercolorButton>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setCreateListingVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Create Project Modal */}
        <Modal visible={createProjectVisible} transparent animationType="slide" onRequestClose={() => setCreateProjectVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Share your build-in-public project</Text>
              <TextInput
                placeholder="Project Title"
                value={projectForm.title}
                onChangeText={text => setProjectForm(prev => ({ ...prev, title: text }))}
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                placeholder="What are you shipping?"
                value={projectForm.summary}
                onChangeText={text => setProjectForm(prev => ({ ...prev, summary: text }))}
                style={[styles.input, styles.inputMultiline]}
                multiline
                placeholderTextColor="#94a3b8"
              />
              <WatercolorButton color="yellow" onPress={handleCreateProject}>
                <Text style={styles.newButtonText}>Publish project</Text>
              </WatercolorButton>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setCreateProjectVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  stars: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#0ea5e9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_5,
    paddingTop: SPACING.space_5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  backIcon: {
    fontSize: 24,
    color: '#1f2937',
  },
  headerTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 28,
    color: '#1f2937',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_3,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    fontSize: 28,
    color: '#1f2937',
  },
  headerAction: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
  },
  headerActionText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  newButton: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    borderRadius: 999,
    backgroundColor: '#0ea5e9',
  },
  newButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    paddingHorizontal: SPACING.space_5,
    paddingVertical: SPACING.space_4,
  },
  tabPill: {
    flex: 1,
    paddingVertical: SPACING.space_2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: 'rgba(77, 161, 255, 0.12)',
    borderColor: '#0ea5e9',
  },
  tabPillText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#64748b',
  },
  tabPillTextActive: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    paddingHorizontal: SPACING.space_5,
    paddingBottom: SPACING.space_3,
  },
  tabChip: {
    flex: 1,
    paddingVertical: SPACING.space_2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
  },
  tabChipActive: {
    backgroundColor: 'rgba(77, 161, 255, 0.12)',
    borderColor: '#0ea5e9',
  },
  tabChipText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#64748b',
  },
  tabChipTextActive: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.space_5,
    paddingBottom: SPACING.space_7,
    gap: SPACING.space_4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: SPACING.space_4,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: SPACING.space_2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderInfo: {
    flex: 1,
    paddingRight: SPACING.space_2,
  },
  creatorRow: {
    flexDirection: 'row',
    gap: SPACING.space_2,
    alignItems: 'center',
  },
  creatorDetails: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
  },
  cardSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  cardBody: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  cardLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: SPACING.space_2,
  },
  cardSkills: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
  },
  statusBadge: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  avatarBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(77, 161, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarInitial: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '700',
  },
  secondaryAction: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  secondaryActionText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
  },
  moreAction: {
    marginLeft: 'auto',
  },
  moreActionText: {
    fontSize: 22,
    color: '#1f2937',
  },
  timestamp: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  followChip: {
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: 'rgba(77, 161, 255, 0.08)',
  },
  followChipText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_2,
    marginTop: SPACING.space_2,
  },
  updateCard: {
    marginTop: SPACING.space_3,
    padding: SPACING.space_3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    gap: SPACING.space_1,
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  updateAuthor: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  updateActions: {
    flexDirection: 'row',
    gap: SPACING.space_3,
    marginTop: SPACING.space_2,
  },
  inlineAction: {
    paddingVertical: SPACING.space_1,
  },
  inlineActionText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  inlineActionActive: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  threadLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  detailModal: {
    backgroundColor: '#fdfbf7',
    margin: SPACING.space_4,
    borderRadius: 24,
    padding: SPACING.space_5,
    maxHeight: '85%',
  },
  detailScroll: {
    marginVertical: SPACING.space_3,
  },
  detailSection: {
    marginBottom: SPACING.space_4,
    gap: SPACING.space_1,
  },
  modalLabel: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalBody: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
  },
  detailMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_2,
    marginTop: SPACING.space_2,
  },
  metaChip: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#1f2937',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  modalFootnote: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: SPACING.space_2,
  },
  detailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.space_2,
    gap: SPACING.space_3,
  },
  closeButton: {
    marginTop: SPACING.space_3,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  latestUpdateContainer: {
    marginTop: SPACING.space_4,
    padding: SPACING.space_3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    gap: SPACING.space_1,
  },
  threadButton: {
    flex: 1,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: SPACING.space_2,
  },
  modalContainer: {
    backgroundColor: '#fdfbf7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.space_5,
    gap: SPACING.space_2,
  },
  largeModal: {
    maxHeight: '80%',
  },
  modalTitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 20,
    color: '#1f2937',
    marginBottom: SPACING.space_2,
  },
  modalSubtitle: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#64748b',
    marginBottom: SPACING.space_2,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: SPACING.space_3,
    paddingVertical: SPACING.space_2,
    color: '#1f2937',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: SPACING.space_2,
  },
  cancelText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#64748b',
  },
  loadingText: {
    fontFamily: 'PatrickHand-Regular',
    fontSize: 16,
    color: '#64748b',
  },
  appsList: {
    maxHeight: 320,
  },
  applicationCard: {
    paddingVertical: SPACING.space_3,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    gap: SPACING.space_1,
  },
  applicationActions: {
    flexDirection: 'row',
    gap: SPACING.space_4,
  },
  acceptText: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  rejectText: {
    color: '#ff1744',
    fontWeight: '600',
  },
  modalOverlayCenter: {
    justifyContent: 'center',
  },
});

export default CollaborationHubScreen;
