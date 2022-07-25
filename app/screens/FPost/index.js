import { FPostListData } from '@data'
import Post, { modes } from '@screens/NewsCategory'
import React from 'react'

const FPost = () => {
	return <Post mode={modes.thList} posts={FPostListData} />
}

export default FPost
