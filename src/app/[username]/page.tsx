import { notFound } from 'next/navigation'
import React from 'react'
import { env } from '../../env/server.mjs'
import DownloadButton from './DownloadButton.component'
import UserConnectionCircle from './UserConnectionCircle.component'

const getUserGithubData = async (username: string) => {
  if (!username) throw new Error('Please pass a username!')

  const getUserData = (segment: string) =>
    fetch(`https://api.github.com/users/${segment}`, {
      headers: {
        Authorization: `token ${env.GITHUB_API_TOKEN}`,
      },
    }).then((res) => (res.ok ? res.json() : null))

  const [userData, userFollowingsData] = await Promise.all([
    getUserData(username),
    getUserData(username + '/following?per_page=50'),
  ])

  if (!userData) return { userData, userConnections: [] }

  // return immediately if we have enough data
  if (userFollowingsData.length === 50) {
    return {
      userData,
      userConnections: userFollowingsData,
    }
  }

  const followingsIdSet = new Set(userFollowingsData.map((user) => user.id))

  const userFollowersData = await getUserData(
    // Requesting extra 20 users
    `${username}/followers?per_page=${70 - userFollowingsData.length}`
  )

  return {
    userData,
    userConnections: [
      ...userFollowingsData,
      ...userFollowersData.filter((user) => !followingsIdSet.has(user.id)),
    ],
  }
}

export default async function UserPage({ params }) {
  const userResult = await getUserGithubData(params.username)

  if (!userResult.userData) notFound()

  return (
    <div className='flex flex-col items-center'>
      <UserConnectionCircle
        avatarUrls={[
          userResult.userData.avatar_url,
          ...(userResult.userConnections?.map((user) => user.avatar_url) ?? []),
        ]}
        bgColor='rgb(14,165,233)'
        size={720}
      />
      <DownloadButton filename={`${userResult.userData.login}_gitorbit.png`} />
    </div>
  )
}