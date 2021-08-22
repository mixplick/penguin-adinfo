import { ObjectStore } from './ObjectStore';
import { FirestoreConnectionSingleton } from '../cloud/FirestoreConnectionSingleton';
import { User } from '../User';
import { CollectionReference, QuerySnapshot, QueryDocumentSnapshot } from '@google-cloud/firestore';
import * as bcrypt from 'bcrypt';

export class UserDAO {
	private _email: string;
	private _password: string;
	private _objectStore: ObjectStore;
	private _authCollection: CollectionReference;
	private _pathToCollection: string[];

	constructor(email?: string, password?: string) {
		this._email = email;
		this._password = password;
		this._objectStore = FirestoreConnectionSingleton.getInstance();
		this._pathToCollection = ['tokens'];
		this._authCollection = this._objectStore.getCollection(this._pathToCollection);
	}

	/**
	 * Busca o ID do usuario na base de dados
	 * @returns ID do usuario
	 */
	public getUserId(): Promise<string | void> {
		return this._objectStore
			.getCollection(this._pathToCollection)
			.where('email', '==', this._email)
			.get()
			.then((querySnapshot: QuerySnapshot) => {
				if (querySnapshot.size > 0) {
					querySnapshot.forEach((documentSnapshot) => {
						const searchId = documentSnapshot.ref.path.match(new RegExp('[^/]+$'));
						const validatePassword = bcrypt.compareSync(this._password, documentSnapshot.get('password'));
						if (!validatePassword) throw new Error('Email ou senha incorreto(s)!');
						if (searchId) {
							return searchId[0];
						} else {
							throw new Error('Falha ao recuperar o ID do usuário');
						}
					});
				} else {
					throw new Error('ID não encontrado!');
				}
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * Consulta o usuario na base de dados
	 * @returns Retorna o usuario procurado
	 */
	public getUser(): Promise<User | void> {
		return this._objectStore
			.getCollection(this._pathToCollection)
			.where('email', '==', this._email)
			.get()
			.then((querySnapshot: QuerySnapshot) => {
				if (querySnapshot.size > 0) {
					let user: User;
					querySnapshot.forEach((documentSnapshot) => {
						const searchId = documentSnapshot.ref.path.match(new RegExp('[^/]+$'));
						if (searchId) {
							const validatePassword = bcrypt.compareSync(this._password, documentSnapshot.get('password'));
							if (!validatePassword) throw new Error('Email ou senha incorreto(s)!');
							user = new User(
								searchId[0],
								documentSnapshot.get('permission'),
								documentSnapshot.get('company'),
								documentSnapshot.get('email'),
								documentSnapshot.get('activate'),
								documentSnapshot.get('agency')
							);
						} else {
							throw new Error();
						}
					});
					return user;
				} else {
					throw new Error('Email ou senha incorreto(s)!');
				}
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * Adiciona um novo usuario na base de dados
	 * @param user Usuario a ser adicionado
	 * @returns ID do novo usuario
	 */
	public addUser(user: User): Promise<string | void> {
		return this._objectStore
			.addDocumentIn(this._authCollection, user.toJsonSave(), '')
			.get()
			.then((data) => {
				return data.id;
			})
			.catch((err) => console.log(err));
	}

	/**
	 * Altera a senha do usuario
	 * @param user Usuario que terá a senha alterada
	 * @returns Retorna True caso a senha tenha sido alterada com sucesso
	 */
	public changePassword(user: User): Promise<boolean | void> {
		return this._objectStore
			.getCollection(this._pathToCollection)
			.doc(user.id)
			.get()
			.then((doc: QueryDocumentSnapshot) => {
				return doc.ref.set(user.toJsonSave());
			})
			.then(() => {
				return true;
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * Desativa um usuário
	 * @param userId ID do usuário a ser desativado
	 * @returns retorna True em caso de sucesso
	 */
	public deactivateUser(userId: string): Promise<boolean | void> {
		return this._objectStore
			.getCollection(this._pathToCollection)
			.doc(userId)
			.get()
			.then((doc: QueryDocumentSnapshot) => {
				const user = doc.data();
				user.activate = false;
				return doc.ref.set(user);
			})
			.then(() => {
				return true;
			})
			.catch((err) => {
				throw err;
			});
	}

	/**
	 * Resativa um usuário
	 * @param userId ID do usuário a ser resativado
	 * @returns retorna True em caso de sucesso
	 */
	public reactivateUser(userId: string): Promise<boolean | void> {
		return this._objectStore
			.getCollection(this._pathToCollection)
			.doc(userId)
			.get()
			.then((doc: QueryDocumentSnapshot) => {
				const user = doc.data();
				user.activate = true;
				return doc.ref.set(user);
			})
			.then(() => {
				return true;
			})
			.catch((err) => {
				throw err;
			});
	}
}
