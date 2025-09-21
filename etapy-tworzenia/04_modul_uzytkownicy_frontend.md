## 04. Frontend — moduł „Użytkownicy” (tylko admin)

Zakres: widoki do przeglądania listy użytkowników, tworzenia nowego użytkownika, zmiany roli, usuwania. Tylko UI i podpięcie do istniejących endpointów z etapu 02. Bez dodatkowych funkcji.

Kroki:
1) W `src/modules/users` dodaj:
   - `api.ts`: funkcje REST (`listUsers`, `createUser`, `updateUserRole`, `deleteUser`).
   - `types.ts`: typy TS odpowiadające schematom backendu.
   - `UsersListPage.tsx`: tabela z użytkownikami (login, email, full name, role, actions).
   - `UserCreateDialog.tsx`: formularz tworzenia (full name, login, email, password, role).
   - `UserRoleSelect.tsx`: komponent zmiany roli (admin-only, inline).

2) Routing: `/app/users` renderuje `UsersListPage` wewnątrz `AppLayout`.

3) Uprawnienia: jeżeli `currentUser.role !== 'admin'`, wykonaj redirect do `/app/contacts`.

4) UX: proste, duże przyciski i czytelne formularze. Bez nadmiarowych pól.

Koniec etapu: Admin może przeglądać, dodawać, zmieniać rolę i usuwać użytkowników przez UI.


