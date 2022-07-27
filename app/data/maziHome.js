import { Images } from '@config'

import {
	ECommerceScreens,
	FinanceScreens,
	FryptoScreens,
	ModalScreens,
	NewsScreens,
	ShareScreens,
	ProjectScreens,
} from '@navigation/config'

console.log('printing Images', Images)

const CommonScreens = { ...ShareScreens, ...ModalScreens }

export const MaziListApp = [
	{
		id: 'MaziHome',
		title: 'home',
		image: '',
		subtitle: '',
		screens: FinanceScreens,
		icon: 'home',
		isHideInHome: true,
		isHideInScreens: true,
	},
	{
		id: 'ECommerceMenu',
		title: 'ecommerce_app',
		image: Images.dashboardEcomercial,
		subtitle: `${Object.keys(ECommerceScreens).length}+ UI KITs`,
		screens: ECommerceScreens,
		icon: 'cart-plus',
	},
	{
		id: 'NewsMenu',
		title: 'news_app',
		image: Images.dashboardNews,
		subtitle: `${Object.keys(NewsScreens).length}+ UI KITs`,
		screens: NewsScreens,
		icon: 'book',
	},
	{
		id: 'ProjectMenu',
		title: 'project_management',
		image: Images.dashboardProject,
		subtitle: `${Object.keys(ProjectScreens).length}+ UI KITs`,
		screens: ProjectScreens,
		icon: 'book',
	},
	{
		id: 'Common',
		description:
			'Fully completed react-native news app that provides most common screens required by any E-commerce app.',
		title: 'Common',
		image: Images.logo,
		subtitle: `${Object.keys(CommonScreens).length}+ UI KITs`,
		screens: CommonScreens,
		icon: '',
		isHideInHome: true,
		isHideInScreens: false,
	},
]
