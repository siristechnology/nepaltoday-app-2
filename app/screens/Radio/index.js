import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { FlatList, ScrollView, View } from 'react-native'
import { useNavigation, useScrollToTop } from '@react-navigation/native'
import TrackPlayer, { Capability, Event, State, useTrackPlayerEvents } from 'react-native-track-player'
import auth from '@react-native-firebase/auth'
import { useTheme } from '@config'
import * as Utils from '@utils'
import { CardChannelGrid, Text } from '@components'
import RadioService from './radio.services'
import SearchBox from './SearchBox'
import styles from './styles'
import { useQuery } from '@apollo/client'
import GET_FM_QUERY from './GET_FM_QUERY'
import BottomPlayer from './Player/index'
import ChannelGrid from './ChannelGrid'
import RadioSearchResults from './SearchResults'
import ScreenContainer from '../ScreenContainer/Index'

const trackPlayerInit = async () => {
	await TrackPlayer.setupPlayer()
	TrackPlayer.updateOptions({
		stopWithApp: true,
		capabilities: [Capability.Play, Capability.Pause, Capability.Stop, Capability.Skip, Capability.SkipToNext],
		compactCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
	})
}

const RadioScreen = (props) => {
	const navigation = useNavigation()
	const appState = useSelector((state) => state.appState.value)
	const [isPlaying, setIsPlaying] = useState(false)
	const [currentChannelId, setCurrentChannelId] = useState('')
	const [search, setSearch] = useState('')
	const { colors } = useTheme()
	const ref = useRef(null)
	useScrollToTop(ref)
	const [refreshing, setRefreshing] = useState(false)
	const [favoriteFms, setFavoriteFms] = useState([])
	const [recentFms, setRecentFms] = useState([])

	useEffect(() => {
		TrackPlayer.registerPlaybackService(
			() =>
				async function () {
					TrackPlayer.addEventListener('remote-play', () => {
						play()
					})

					TrackPlayer.addEventListener('remote-pause', () => {
						pause()
					})

					TrackPlayer.addEventListener('remote-stop', () => {
						stop()
					})

					TrackPlayer.addEventListener('remote-next', () => {
						skipNext()
					})

					TrackPlayer.addEventListener('remote-duck', () => {
						pause()
					})
				},
		)
	}, [])

	const onFMSelect = async (channel) => {
		await TrackPlayer.reset()
		await TrackPlayer.add({ ...channel, type: 'default' })
		await TrackPlayer.play()
		setCurrentChannelId(channel.id)
		RadioService.saveRecent(channel).then((fms) => setRecentFms(fms))
	}

	const play = async () => {
		await TrackPlayer.play()
	}

	const pause = async () => {
		await TrackPlayer.pause()
	}

	const stop = async () => {
		setCurrentChannelId('')
		await TrackPlayer.reset()
	}

	const skipNext = async () => {
		const currentIndex = fmList.indexOf(fmList.find((f) => f.id == currentChannelId))
		const nextIndex = (currentIndex + 1) % fmList.length
		onFMSelect(fmList[nextIndex])
	}

	const onFavourite = () => {
		const nid = auth().currentUser.uid
		const currentChannel = fmList.filter((x) => x.id === currentChannelId)[0]
		const isFavorite = favoriteFms.some((f) => f.id == currentChannel.id)

		if (isFavorite) {
			RadioService.deleteFavorite(nid, currentChannel.id).then((favList) => {
				setFavoriteFms(favList)
			})
		} else {
			RadioService.saveFavorite(nid, currentChannel).then((favList) => {
				setFavoriteFms(favList)
			})
		}
	}

	useEffect(() => {
		RadioService.getFavorites().then((fmList) => setFavoriteFms(fmList))
		RadioService.getRecents().then((fmList) => setRecentFms(fmList))
	}, [])

	useEffect(() => {
		if (appState == 'active') {
			const startPlayer = async () => {
				await trackPlayerInit()
			}
			startPlayer().catch(() => {})
		}
	}, [appState])

	const { data, loading, error, refetch } = useQuery(GET_FM_QUERY, {
		variables: {},
	})

	const fmList = data?.getMyFm?.allFm.filter((fm) => !fm.isDisabled) || []

	useTrackPlayerEvents([Event.PlaybackState], (event) => {
		if (event.state === State.Playing) {
			setIsPlaying(true)
		} else {
			setIsPlaying(false)
		}
	})

	const handleRefresh = () => {
		setRefreshing(true)
		refetch().then(() => setRefreshing(false))
	}

	const currentChannel = fmList.filter((x) => x.id === currentChannelId)[0]
	const iscurrentChannelFavorite = favoriteFms?.some((f) => f.id == currentChannel?.id)

	const popularFms = fmList
		.filter((fm) => fm.popularity != null)
		.sort((a, b) => b.popularity - a.popularity)
		.slice(0, 20)

	return (
		<ScreenContainer navigation={navigation} handleRefresh={handleRefresh}>
			<ScrollView scrollEventThrottle={16} keyboardShouldPersistTaps="handled" ref={ref}>
				<View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
					<Text title1 bold>
						{'रेडियो'}
					</Text>
				</View>

				<SearchBox search={search} setSearch={setSearch} loading={loading} />

				{search.trim() != '' && <RadioSearchResults search={search} fmList={fmList} onPlay={onFMSelect} />}

				{search.trim() == '' && (
					<>
						<View>
							{favoriteFms?.length > 0 && (
								<View>
									<Text title3 bold style={[styles.title, styles.paddingView]}>
										{'Your Stations'}
									</Text>
									<FlatList
										horizontal={true}
										showsHorizontalScrollIndicator={false}
										data={favoriteFms}
										keyExtractor={(item) => item.id}
										renderItem={({ item, index }) => (
											<CardChannelGrid
												onPress={() => onFMSelect(item, fmList)}
												image={{ uri: item.artwork }}
												style={{
													paddingTop: 10,
													width: Utils.scaleWithPixel(100),
													height: Utils.scaleWithPixel(100),
													alignItems: 'center',
													justifyContent: 'center',
												}}
												imgStyle={{
													width: Utils.scaleWithPixel(70),
													height: Utils.scaleWithPixel(70),
													borderWidth: 1,
													borderColor: colors.border,
												}}
												textStyle={{
													fontSize: 16,
													textAlign: 'center',
												}}
												title={item.title}
											/>
										)}
									/>
								</View>
							)}
						</View>

						<ChannelGrid
							title={'Popular Stations'}
							fmList={popularFms}
							onFMSelect={onFMSelect}
							loading={loading}
							styles={styles}
						/>

						<ChannelGrid
							title={'Recent Stations'}
							fmList={recentFms}
							onFMSelect={onFMSelect}
							loading={loading}
							styles={styles}
						/>
					</>
				)}
			</ScrollView>
			{currentChannel != null && (
				<BottomPlayer
					isPlaying={isPlaying}
					currentChannel={currentChannel}
					onPlay={play}
					onPause={pause}
					onSkipNext={skipNext}
					isFavourite={iscurrentChannelFavorite}
					onFavourite={onFavourite}
				/>
			)}
		</ScreenContainer>
	)
}

export default RadioScreen
