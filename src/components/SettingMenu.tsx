import React, { useState } from 'react';
import { Timings } from '../model/timings';
import { UserNode } from '../model/user';
import { WhitelistManager } from './WhitelistManager';

interface SettingMenuProps {
  setSettingState: (state: boolean) => void;
  currentTimings: Timings;
  setTimings: (timings: Timings) => void;
  whitelistedUsers: readonly UserNode[];
  onWhitelistUpdate: (users: readonly UserNode[]) => void;
}

export const SettingMenu = ({
  setSettingState,
  currentTimings,
  setTimings,
  whitelistedUsers,
  onWhitelistUpdate,
}: SettingMenuProps) => {
  const [timeBetweenSearchCycles, setTimeBetweenSearchCycles] = useState(currentTimings.timeBetweenSearchCycles);
  const [timeToWaitAfterFiveSearchCycles, setTimeToWaitAfterFiveSearchCycles] = useState(currentTimings.timeToWaitAfterFiveSearchCycles);
  const [timeBetweenUnfollows, setTimeBetweenUnfollows] = useState(currentTimings.timeBetweenUnfollows);
  const [timeToWaitAfterFiveUnfollows, setTimeToWaitAfterFiveUnfollows] = useState(currentTimings.timeToWaitAfterFiveUnfollows);

  const applyPreset = (preset: Timings) => {
    setTimeBetweenSearchCycles(preset.timeBetweenSearchCycles);
    setTimeToWaitAfterFiveSearchCycles(preset.timeToWaitAfterFiveSearchCycles);
    setTimeBetweenUnfollows(preset.timeBetweenUnfollows);
    setTimeToWaitAfterFiveUnfollows(preset.timeToWaitAfterFiveUnfollows);
  };

  const handleSave = (event: any) => {
    event.preventDefault();
    setTimings({
      timeBetweenSearchCycles,
      timeToWaitAfterFiveSearchCycles,
      timeBetweenUnfollows,
      timeToWaitAfterFiveUnfollows,
    });
    setSettingState(false);
  };

  // @ts-ignore
  const handleInputChange = (event: any, setter: (value: number) => void) => {

    const value = Number(event?.target?.value);
    setter(value);
  };

  return (
    <form onSubmit={handleSave}>
      <div className='backdrop'>
        <div className='setting-menu'>
          {/* Settings Module */}
          <div className='settings-module'>
            <div className='module-header'>
              <h3>Settings</h3>
            </div>

            <div className='settings-content'>
              <div className='row'>
                <label className='minimun-width'>Speed preset</label>
                <div className='flex align-center gap-small'>
                  <button
                    type='button'
                    className='btn'
                    onClick={() =>
                      applyPreset({
                        timeBetweenSearchCycles: 1000,
                        timeToWaitAfterFiveSearchCycles: 6000,
                        timeBetweenUnfollows: 2200,
                        timeToWaitAfterFiveUnfollows: 25000,
                      })
                    }
                  >
                    Safer
                  </button>
                  <button
                    type='button'
                    className='btn'
                    onClick={() =>
                      applyPreset({
                        timeBetweenSearchCycles: 750,
                        timeToWaitAfterFiveSearchCycles: 4500,
                        timeBetweenUnfollows: 1400,
                        timeToWaitAfterFiveUnfollows: 15000,
                      })
                    }
                  >
                    Balanced
                  </button>
                  <button
                    type='button'
                    className='btn'
                    onClick={() =>
                      applyPreset({
                        timeBetweenSearchCycles: 500,
                        timeToWaitAfterFiveSearchCycles: 2500,
                        timeBetweenUnfollows: 900,
                        timeToWaitAfterFiveUnfollows: 8000,
                      })
                    }
                  >
                    Fast
                  </button>
                </div>
              </div>
              <div className='row'>
                <label className='minimun-width'>Default time between search cycles</label>
                <input
                  type='number'
                  id='searchCycles'
                  name='searchCycles'
                  min={300}
                  max={999999}
                  value={timeBetweenSearchCycles}
                  onChange={e => handleInputChange(e, setTimeBetweenSearchCycles)}
                />
                <label className='margin-between-input-and-label'>(ms)</label>
              </div>

              <div className='row'>
                <label className='minimun-width'>Default periodic search cooldown</label>
                <input
                  type='number'
                  id='fiveSearchCycles'
                  name='fiveSearchCycles'
                  min={2000}
                  max={999999}
                  value={timeToWaitAfterFiveSearchCycles}
                  onChange={e => handleInputChange(e, setTimeToWaitAfterFiveSearchCycles)}
                />
                <label className='margin-between-input-and-label'>(ms)</label>
              </div>

              <div className='row'>
                <label className='minimun-width'>Default time between unfollows</label>
                <input
                  type='number'
                  id='timeBetweenUnfollow'
                  name='timeBetweenUnfollow'
                  min={800}
                  max={999999}
                  value={timeBetweenUnfollows}
                  onChange={e => handleInputChange(e, setTimeBetweenUnfollows)}
                />
                <label className='margin-between-input-and-label'>(ms)</label>
              </div>

              <div className='row'>
                <label className='minimun-width'>Default periodic unfollow cooldown</label>
                <input
                  type='number'
                  id='timeAfterFiveUnfollows'
                  name='timeAfterFiveUnfollows'
                  min={5000}
                  max={999999}
                  value={timeToWaitAfterFiveUnfollows}
                  onChange={e => handleInputChange(e, setTimeToWaitAfterFiveUnfollows)}
                />
                <label className='margin-between-input-and-label'>(ms)</label>
              </div>

              <div className='warning-container'>
                <h3 className='warning'><b>WARNING:</b> Modifying these settings can lead to your account being banned.</h3>
                <h3 className='warning'>USE IT AT YOUR OWN RISK!!!!</h3>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className='module-divider' />

          {/* Whitelist Management Module */}
          <div className='whitelist-module'>
            <WhitelistManager
              whitelistedUsers={whitelistedUsers}
              onWhitelistUpdate={onWhitelistUpdate}
            />
          </div>

          {/* Action Buttons */}
          <div className='btn-container'>
            <button className='btn' type='button' onClick={() => setSettingState(false)}>Cancel</button>
            <button className='btn' type='submit'>Save</button>
          </div>
        </div>
      </div>
    </form>
  );
};
