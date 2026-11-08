export default function RefSiteFooter() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 w-full">
      <div className="ref-container px-4 mx-auto pt-16 pb-8 sm:pt-24 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <span className="font-black text-xl inline-block text-orange-600 w-30">.cimrivilla</span>
            <p className="text-sm/6 text-balance text-neutral-800 dark:text-neutral-400">
              Curating the finest collection of luxury villas in Kalkan. 100% best price guarantee on exclusive
              Mediterranean retreats.
            </p>
            <div className="flex gap-x-6">
              <span className="text-neutral-900" aria-hidden>
                <span className="sr-only">Facebook</span>
                <svg fill="currentColor" viewBox="0 0 24 24" className="size-6">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-neutral-900" aria-hidden>
                <span className="sr-only">Instagram</span>
                <svg fill="currentColor" viewBox="0 0 24 24" className="size-6">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm/6 font-semibold text-neutral-900 dark:text-neutral-300">Villas in Kalkan</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li className="text-sm/6 text-neutral-800 dark:text-neutral-400">Infinity Pool Villas</li>
                  <li className="text-sm/6 text-neutral-800 dark:text-neutral-400">Sea View Estates</li>
                  <li className="text-sm/6 text-neutral-800 dark:text-neutral-400">Honeymoon Retreats</li>
                  <li className="text-sm/6 text-neutral-800 dark:text-neutral-400">Large Family Villas</li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm/6 font-semibold text-neutral-900 dark:text-neutral-300">Guest Services</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li className="text-sm/6 text-neutral-800 dark:text-neutral-400">Airport Transfers</li>
                  <li className="text-sm/6 text-neutral-800 dark:text-neutral-400">Car Rentals</li>
                  <li className="text-sm/6 text-neutral-800 dark:text-neutral-400">Private Chef</li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm/6 font-semibold text-neutral-900 dark:text-neutral-300">Company</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li className="text-sm/6 text-neutral-800 dark:text-neutral-400">About Us</li>
                  <li className="text-sm/6 text-neutral-800 dark:text-neutral-400">Contact</li>
                  <li className="text-sm/6 text-neutral-800 dark:text-neutral-400">Villas for Sale</li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm/6 font-semibold text-neutral-900 dark:text-neutral-300">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li className="text-sm/6 text-neutral-800 dark:text-neutral-400">Terms of service</li>
                  <li className="text-sm/6 text-neutral-800 dark:text-neutral-400">Privacy policy</li>
                  <li className="text-sm/6 text-neutral-800 dark:text-neutral-400">Booking Terms</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-neutral-100 pt-8 sm:mt-20 lg:mt-24 dark:border-neutral-800">
          <p className="text-sm/6 text-neutral-800">© 2026 Your Luxury Villa Company. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
