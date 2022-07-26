import React, { useEffect, useState } from 'react'
import { FlatList, ScrollView, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useLazyQuery } from '@apollo/react-hooks'
import crashlytics from '@react-native-firebase/crashlytics'
import { CardSlide, News169, NewsList, SafeAreaView, Text } from '@components'
import { BaseColor, BaseStyle } from '@config'
import { HomeChannelData, HomeListData, HomePopularData, HomeTopicData } from '@data'
import styles from './styles'
import { fetchfromAsync, storetoAsync } from '../../helper/cacheStorage'
import { getFormattedCurrentNepaliDate } from '../../helper/dateFormatter'
import GET_ARTICLES_QUERY from './GET_ARTICLES_QUERY'
import Weather from './weather.component'

const Home = (props) => {
	const { navigation } = props
	const [nepaliDate, setNepaliDate] = useState('')
	const [refreshing, setRefreshing] = useState(false)
	const [topics, setTopics] = useState(HomeTopicData)
	const [channels, setChannels] = useState(HomeChannelData)
	const [popular, setPopular] = useState(HomePopularData)
	const [list, setList] = useState(HomeListData)
	const [localArticles, setLocalArticles] = useState({ getArticles: [] })

	const [fetchNews, { loading, data, refetch, error, called }] = useLazyQuery(GET_ARTICLES_QUERY, {
		variables: {},
	})

	const handleRefresh = () => {
		setRefreshing(true)
		if (called) {
			refetch()
				.then(() => {
					setRefreshing(false)
				})
				.catch((err) => setRefreshing(false))
		} else {
			fetchNews()
			setRefreshing(false)
		}
	}

	const fetchArticlesFromAsyncStorage = async () => {
		fetchfromAsync()
			.then((res) => {
				setLocalArticles({ getArticles: res })
			})
			.catch((err) => {
				crashlytics().recordError(err)
				setLocalArticles([])
			})
	}

	useEffect(() => {
		getFormattedCurrentNepaliDate().then((npDate) => {
			setNepaliDate(npDate)
		})
		fetchArticlesFromAsyncStorage()
			.then(() => {
				fetchNews()
			})
			.then(() => {
				const article = props.route.params?.article
				if (article && article.source) {
					props.navigation.navigate('ArticleDetail', { article, articles: [article] })
				}
			})
	}, [fetchNews])

	if (!loading && data != null && data.getArticles && data.getArticles.length) {
		const myArticles = data.getArticles
		storetoAsync(myArticles)
	}

	if (error) {
		crashlytics().recordError(new Error(error))
	}

	const dataArticles = (data && data.getArticles) || []

	const homeArticles = (dataArticles.length && dataArticles) || localArticles.getArticles

	const topHeadline = homeArticles.find((a) => a.category === 'headline') || homeArticles[0]
	const topNews = homeArticles
		.filter((a) => a._id !== topHeadline._id)
		.sort((a, b) => b.totalWeight - a.totalWeight)
		.slice(0, 100)

	const entertainmentArticles = homeArticles.filter((x) => x.category == 'entertainment') || []

	const goPostDetail = (article) => () => {
		navigation.navigate('PostDetail', { article: article })
	}

	const goToCategory = () => {
		navigation.navigate('Category')
	}

	const renderContent = () => {
		return (
			<View>
				<View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
					<Text title1 bold>
						{nepaliDate}
					</Text>
					<Weather />
				</View>
				<ScrollView contentContainerStyle={styles.paddingSrollView}>
					<News169 article={topHeadline} loading={loading} onPress={goPostDetail(topHeadline)} />
					<FlatList
						scrollEnabled={false}
						contentContainerStyle={styles.paddingFlatList}
						data={topNews.slice(0, 3)}
						keyExtractor={(item) => item._id}
						renderItem={({ item, index }) => (
							<NewsList
								loading={loading}
								article={item}
								image={item.image}
								title={item.title}
								subtitle={item.subtitle}
								date={item.date}
								style={{
									marginBottom: index == list.length - 1 ? 0 : 15,
								}}
								onPress={goPostDetail(item)}
							/>
						)}
					/>

					<FlatList
						contentContainerStyle={styles.paddingFlatList}
						horizontal={true}
						showsHorizontalScrollIndicator={false}
						data={entertainmentArticles}
						keyExtractor={(item) => item._id}
						renderItem={({ item, index }) => (
							<CardSlide
								loading={loading}
								article={item}
								onPress={goPostDetail(item)}
								style={{
									marginRight: index == popular.length - 1 ? 0 : 15,
								}}
							/>
						)}
					/>

					<FlatList
						scrollEnabled={false}
						contentContainerStyle={styles.paddingFlatList}
						data={topNews.slice(3)}
						keyExtractor={(item, index) => index.toString()}
						renderItem={({ item, index }) => (
							<NewsList
								loading={loading}
								article={item}
								style={{
									marginBottom: index == list.length - 1 ? 0 : 15,
								}}
								onPress={goPostDetail(item)}
							/>
						)}
					/>
				</ScrollView>
			</View>
		)
	}

	return (
		<View style={{ flex: 1 }}>
			<SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
				{renderContent()}
			</SafeAreaView>
		</View>
	)
}

export default Home
