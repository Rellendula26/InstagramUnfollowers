import React from 'react';
import { assertUnreachable, getCurrentPageUnfollowers, getMaxPage, getUsersForDisplay, isWithoutProfilePicture } from '../utils/utils';
import { State } from '../model/state';
import { UserNode } from '../model/user';
import { SMART_QUEUE_MIN_FOLLOW_DAYS, WHITELISTED_RESULTS_STORAGE_KEY } from '../constants/constants';
import { loadFollowHistory } from '../utils/whitelist-manager';


export interface SearchingProps {
  state: State;
  setState: (state: State) => void;
  scanningPaused: boolean;
  pauseScan: () => void;
  handleScanFilter: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleUser: (checked: boolean, user: UserNode) => void;
  UserCheckIcon: React.FC;
  UserUncheckIcon: React.FC;
}

export const Searching = ({
  state,
  setState,
  scanningPaused,
  pauseScan,
  handleScanFilter,
  toggleUser,
  UserCheckIcon,
  UserUncheckIcon,
}: SearchingProps) => {
  if (state.status !== 'scanning') {
    return null;
  }

  const usersForDisplay = getUsersForDisplay(
    state.results,
    state.whitelistedResults,
    state.currentTab,
    state.searchTerm,
    state.filter,
  );
  let currentLetter = '';

  const onNewLetter = (firstLetter: string) => {
    currentLetter = firstLetter;
    return <div className='alphabet-character'>{currentLetter}</div>;
  };

  const PERSONAL_ALT_KEYWORDS = ['spam', 'dump', 'finsta', 'alt', 'private', 'priv', 'closefriends', 'cf'];
  const PUBLIC_ACCOUNT_KEYWORDS = ['official', 'news', 'media', 'music', 'tv', 'shop', 'store', 'brand', 'fanpage', 'meme', 'quotes'];
  const followHistory = loadFollowHistory();

  const hasKeyword = (value: string, keywords: readonly string[]) => {
    const normalized = value.toLowerCase();
    return keywords.some(keyword => normalized.includes(keyword));
  };

  const isLikelyPersonalAlt = (user: UserNode) =>
    hasKeyword(user.username, PERSONAL_ALT_KEYWORDS) || hasKeyword(user.full_name, PERSONAL_ALT_KEYWORDS);

  const isLikelyPublicAccount = (user: UserNode) =>
    user.is_verified || hasKeyword(user.username, PUBLIC_ACCOUNT_KEYWORDS) || hasKeyword(user.full_name, PUBLIC_ACCOUNT_KEYWORDS);

  const isLikelyImportant = (user: UserNode) =>
    user.follows_viewer || user.is_private || user.is_verified || isLikelyPersonalAlt(user);

  const getFollowAgeDays = (user: UserNode): number | null => {
    const record = followHistory[user.id];
    if (record === undefined) {
      return null;
    }
    return Math.floor((Date.now() - record.firstSeenAt) / (1000 * 60 * 60 * 24));
  };

  const hasEnoughFollowAge = (user: UserNode): boolean => {
    const ageDays = getFollowAgeDays(user);
    return ageDays !== null && ageDays >= SMART_QUEUE_MIN_FOLLOW_DAYS;
  };

  const addUsersToSelection = (usersToAdd: readonly UserNode[]) => {
    const currentIds = new Set(state.selectedResults.map(user => user.id));
    const uniqueUsers = usersToAdd.filter(user => !currentIds.has(user.id));
    if (uniqueUsers.length === 0) {
      return;
    }
    setState({
      ...state,
      selectedResults: [...state.selectedResults, ...uniqueUsers],
    });
  };

  const updateWhitelist = (nextWhitelist: readonly UserNode[]) => {
    localStorage.setItem(
      WHITELISTED_RESULTS_STORAGE_KEY,
      JSON.stringify(nextWhitelist),
    );
    setState({ ...state, whitelistedResults: nextWhitelist });
  };

  return (
    <section className='workspace-layout'>
      <aside className='app-sidebar'>
        <div className='sidebar-content'>
          <div className='panel-heading'>
            <span>Scanner</span>
            <strong>{state.percentage}%</strong>
          </div>
          <menu className='sidebar-filters-grid'>
            <p>Filter</p>
            <label className='badge m-small'>
              <input
                type='checkbox'
                name='showNonFollowers'
                checked={state.filter.showNonFollowers}
                onChange={handleScanFilter}
              />
              &nbsp;Non-Followers
            </label>
            <label className='badge m-small'>
              <input
                type='checkbox'
                name='showFollowers'
                checked={state.filter.showFollowers}
                onChange={handleScanFilter}
              />
              &nbsp;Followers
            </label>
            <label className='badge m-small'>
              <input
                type='checkbox'
                name='showVerified'
                checked={state.filter.showVerified}
                onChange={handleScanFilter}
              />
              &nbsp;Verified
            </label>
            <label className='badge m-small'>
              <input
                type='checkbox'
                name='showPrivate'
                checked={state.filter.showPrivate}
                onChange={handleScanFilter}
              />
              &nbsp;Private
            </label>
            <label className='badge m-small'>
              <input
                type='checkbox'
                name='showWithOutProfilePicture'
                checked={state.filter.showWithOutProfilePicture}
                onChange={handleScanFilter}
              />
              &nbsp;No Pic
            </label>
          </menu>

          <div className='sidebar-buttons-grid'>
            <button
              className='button-secondary'
              title='Queue non-followers while skipping important accounts'
              onClick={() => {
                const smartQueue = usersForDisplay.filter(user =>
                  !user.follows_viewer
                  && !isLikelyImportant(user)
                  && hasEnoughFollowAge(user),
                );
                if (smartQueue.length === 0) {
                  alert(`No users matched strict Smart Queue criteria yet.\n\nTry "Smart Queue + Recent" or scan again after ${SMART_QUEUE_MIN_FOLLOW_DAYS} days to build follow-age history.`);
                  return;
                }
                addUsersToSelection(smartQueue);
              }}
            >
              Smart Queue
            </button>
            <button
              className='button-secondary'
              title='Queue non-followers while skipping important accounts, including recent/unknown follow age'
              onClick={() => {
                const smartQueueInclusive = usersForDisplay.filter(user =>
                  !user.follows_viewer && !isLikelyImportant(user),
                );
                addUsersToSelection(smartQueueInclusive);
              }}
            >
              Smart Queue + Recent
            </button>
            <button
              className='button-secondary'
              title='Queue likely celebrity/brand/public accounts'
              onClick={() => {
                const publicQueue = usersForDisplay.filter(user =>
                  !user.follows_viewer && isLikelyPublicAccount(user),
                );
                addUsersToSelection(publicQueue);
              }}
            >
              Queue Celeb/Brand
            </button>
            <button
              className='button-secondary'
              title='Whitelist likely personal alts/spam-dump accounts'
              onClick={() => {
                const likelyPersonalAccounts = usersForDisplay.filter(user => isLikelyPersonalAlt(user));
                if (likelyPersonalAccounts.length === 0) {
                  alert('No likely personal alt/spam-dump accounts found in the current view.');
                  return;
                }
                const whitelistIds = new Set(state.whitelistedResults.map(user => user.id));
                const whitelistToAdd = likelyPersonalAccounts.filter(user => !whitelistIds.has(user.id));
                if (whitelistToAdd.length === 0) {
                  alert('All likely personal alt/spam-dump accounts are already whitelisted.');
                  return;
                }
                const nextWhitelist = [...state.whitelistedResults, ...whitelistToAdd];
                const protectedIds = new Set(whitelistToAdd.map(user => user.id));
                updateWhitelist(nextWhitelist);
                setState({
                  ...state,
                  whitelistedResults: nextWhitelist,
                  selectedResults: state.selectedResults.filter(user => !protectedIds.has(user.id)),
                });
                alert(`Protected ${whitelistToAdd.length} likely personal alt/spam-dump account(s).`);
              }}
            >
              Protect Alts
            </button>
            <button
              className='button-secondary'
              title='Whitelist selected verified/private/follower accounts'
              onClick={() => {
                const importantSelected = state.selectedResults.filter(user =>
                  isLikelyImportant(user),
                );
                if (importantSelected.length === 0) {
                  alert('No important accounts detected in your selected users.');
                  return;
                }
                const whitelistIds = new Set(state.whitelistedResults.map(user => user.id));
                const whitelistToAdd = importantSelected.filter(user => !whitelistIds.has(user.id));
                if (whitelistToAdd.length === 0) {
                  alert('Important selected accounts are already whitelisted.');
                  return;
                }
                const nextWhitelist = [...state.whitelistedResults, ...whitelistToAdd];
                const protectedIds = new Set(whitelistToAdd.map(user => user.id));
                updateWhitelist(nextWhitelist);
                setState({
                  ...state,
                  whitelistedResults: nextWhitelist,
                  selectedResults: state.selectedResults.filter(user => !protectedIds.has(user.id)),
                });
                alert(`Protected ${whitelistToAdd.length} account(s) and removed them from queue.`);
              }}
            >
              Protect Selected
            </button>
            <button
              className='button-secondary'
              onClick={() => {
                const verifiedUsers = usersForDisplay.filter(user => user.is_verified);
                addUsersToSelection(verifiedUsers);
              }}
            >
              Verified
            </button>
            <button
              className='button-secondary'
              onClick={() => {
                const privateUsers = usersForDisplay.filter(user => user.is_private);
                addUsersToSelection(privateUsers);
              }}
            >
              Private
            </button>
            <button
              className='button-secondary'
              onClick={() => {
                const noPicUsers = usersForDisplay.filter(user => isWithoutProfilePicture(user));
                addUsersToSelection(noPicUsers);
              }}
            >
              No Pic
            </button>
            <button
              className='button-secondary danger-text'
              onClick={() => setState({ ...state, selectedResults: [] })}
            >
              Clear
            </button>
          </div>
          <div className='sidebar-stats metric-stack'>
            <p><span>Displayed</span><strong>{usersForDisplay.length}</strong></p>
            <p><span>Total scanned</span><strong>{state.results.length}</strong></p>
            <p className='whitelist-counter'>
              <span>Whitelisted</span><strong>★ {state.whitelistedResults.length}</strong>
            </p>
            <p>
              <span>Likely alts</span><strong>{usersForDisplay.filter(user => isLikelyPersonalAlt(user)).length}</strong>
            </p>
            <p>
              <span>Smart-ready ({SMART_QUEUE_MIN_FOLLOW_DAYS}d+)</span>
              <strong>{usersForDisplay.filter(user => !user.follows_viewer && !isLikelyImportant(user) && hasEnoughFollowAge(user)).length}</strong>
            </p>
          </div>

          {state.percentage === 100 && (
            <div className='sidebar-summary'>
              <h4>Scan Summary</h4>
              <div className='summary-grid'>
                <div className='summary-item'>
                  <span>Non-Followers</span>
                  <strong>{state.results.filter(u => !u.follows_viewer).length}</strong>
                </div>
                <div className='summary-item'>
                  <span>Verified</span>
                  <strong>{state.results.filter(u => u.is_verified).length}</strong>
                </div>
                <div className='summary-item'>
                  <span>Private</span>
                  <strong>{state.results.filter(u => u.is_private).length}</strong>
                </div>
              </div>
            </div>
          )}
          <div className='sidebar-footer-controls'>
            <button
              className='button-control button-pause'
              onClick={pauseScan}
            >
              {scanningPaused ? 'Resume' : 'Pause'}
            </button>
            <div className='sidebar-pagination'>
              <div className='pagination-controls'>
                <a
                  onClick={() => {
                    if (state.page - 1 > 0) {
                      setState({
                        ...state,
                        page: state.page - 1,
                      });
                    }
                  }}
                >
                  ❮
                </a>
                <span>
                  {state.page}/{getMaxPage(usersForDisplay)}
                </span>
                <a
                  onClick={() => {
                    if (state.page < getMaxPage(usersForDisplay)) {
                      setState({
                        ...state,
                        page: state.page + 1,
                      });
                    }
                  }}
                >
                  ❯
                </a>
              </div>
            </div>
          </div>
        </div>
        <button
          className='unfollow'
          onClick={() => {
            if (state.selectedResults.length === 0) {
              alert('Must select at least a single user to unfollow');
              return;
            }
            const riskyAccounts = state.selectedResults.filter(user =>
              isLikelyImportant(user),
            );
            if (riskyAccounts.length > 0) {
              const preview = riskyAccounts
                .slice(0, 5)
                .map(user => `@${user.username}`)
                .join(', ');
              const suffix = riskyAccounts.length > 5 ? ', ...' : '';
              const warningMessage = [
                `Heads up: ${riskyAccounts.length} selected account(s) look important.`,
                '(verified/private/follows-you/personal-alt pattern)',
                '',
                `${preview}${suffix}`,
                '',
                'Press Cancel to review and protect them first.',
              ].join('\n');
              if (!confirm(warningMessage)) {
                return;
              }
            }
            if (!confirm(`Unfollow ${state.selectedResults.length} selected account(s)?`)) {
              return;
            }
            // TODO TEMP until types are properly fixed
            // @ts-ignore
            setState(prevState => {
              if (prevState.status !== 'scanning') {
                return prevState;
              }
              const newState: State = {
                ...prevState,
                status: 'unfollowing',
                percentage: 0,
                unfollowLog: [],
                filter: {
                  showSucceeded: true,
                  showFailed: true,
                },
              };
              return newState;
            });
          }}
        >
          Unfollow ({state.selectedResults.length})
        </button>
      </aside>
      <article className='results-container'>
        <nav className='tabs-container'>
          <button
            type='button'
            className={`tab ${state.currentTab === 'non_whitelisted' ? 'tab-active' : ''}`}
            onClick={() => {
              if (state.currentTab === 'non_whitelisted') {
                return;
              }
              setState({
                ...state,
                currentTab: 'non_whitelisted',
                page: 1,
              });
            }}
          >
            Non-Whitelisted
          </button>
          <button
            type='button'
            className={`tab ${state.currentTab === 'whitelisted' ? 'tab-active' : ''}`}
            onClick={() => {
              if (state.currentTab === 'whitelisted') {
                return;
              }
              setState({
                ...state,
                currentTab: 'whitelisted',
                page: 1,
              });
            }}
          >
            Whitelisted
          </button>
        </nav>
        {getCurrentPageUnfollowers(usersForDisplay, state.page).map(user => {
          const firstLetter = user.username.substring(0, 1).toUpperCase();
          return (
            <>
              {firstLetter !== currentLetter && onNewLetter(firstLetter)}
              <label className='result-item'>
                <div className='flex grow align-center'>
                  <div
                    className='avatar-container'
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      // Prevent selecting result when trying to add to whitelist.
                      e.preventDefault();
                      e.stopPropagation();
                      let whitelistedResults: readonly UserNode[] = [];
                      switch (state.currentTab) {
                        case 'non_whitelisted':
                          whitelistedResults = [...state.whitelistedResults, user];
                          break;

                        case 'whitelisted':
                          whitelistedResults = state.whitelistedResults.filter(
                            result => result.id !== user.id,
                          );
                          break;

                        default:
                          assertUnreachable(state.currentTab);
                      }
                      localStorage.setItem(
                        WHITELISTED_RESULTS_STORAGE_KEY,
                        JSON.stringify(whitelistedResults),
                      );
                      setState({
                        ...state,
                        whitelistedResults,
                        selectedResults: state.selectedResults.filter(result => result.id !== user.id),
                      });
                    }}
                  >
                    <img
                      className='avatar'
                      alt={user.username}
                      src={user.profile_pic_url}
                    />
                    <span className='avatar-icon-overlay-container'>
                      {state.currentTab === 'non_whitelisted' ? (
                        <UserCheckIcon />
                      ) : (
                        <UserUncheckIcon />
                      )}
                    </span>
                  </div>
                  <div className='flex column m-medium'>
                    <a
                      className='fs-xlarge'
                      target='_blank'
                      href={`/${user.username}`}
                      rel='noreferrer'
                    >
                      {user.username}
                    </a>
                    <span className='fs-medium'>{user.full_name}</span>
                  </div>
                  {user.is_verified && <div className='verified-badge'>✔</div>}
                  {user.is_private && (
                    <div className='flex justify-center w-100'>
                      <span className='private-indicator'>Private</span>
                    </div>
                  )}
                </div>
                <div className='flex align-center gap-small'>
                  <input
                    className='account-checkbox'
                    type='checkbox'
                    checked={state.selectedResults.indexOf(user) !== -1}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => toggleUser(e.currentTarget.checked, user)}
                  />
                </div>
              </label>
            </>
          );
        })}
      </article>
    </section>
  );
};
